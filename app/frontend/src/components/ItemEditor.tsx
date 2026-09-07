import { useEffect, useState, useCallback } from "react";
import {
  Container, Typography, Box, TextField, Button, Tabs, Tab,
  IconButton, Collapse, Alert, Stack, Select, MenuItem, FormControl, InputLabel
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon, Visibility as VisibilityIcon } from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

interface Part {
  id: string;
  node_type: "question" | "subpart";
  title: string;
  prompt_html: string;
  marks: number | null;
  children: Part[];
}

interface ItemData {
  id: string;
  type: string;
  attributes: {
    title: string;
    stimulus_html: string;
    prompt_html: string;
    marks: number | null;
    estimated_minutes: number | null;
    is_parameterizable: boolean;
    item_type: string;
    difficulty_nominal: number | null;
    node_type: number;
    status: number;
    content_hash: string;
    department_id: number;
    author_id: number;
    parent_id: number | null;
    created_at: string;
    updated_at: string;
  };
}

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

function PartNode({ part, depth, onUpdate, onRemove, onAddChild }: {
  part: Part;
  depth: number;
  onUpdate: (updated: Part) => void;
  onRemove: () => void;
  onAddChild: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [localPrompt, setLocalPrompt] = useState(part.prompt_html);

  useEffect(() => { setLocalPrompt(part.prompt_html); }, [part.prompt_html]);

  const handlePromptChange = (value: string) => {
    setLocalPrompt(value);
    onUpdate({ ...part, prompt_html: value });
  };

  return (
    <Box sx={{ ml: depth * 3, border: "1px solid", borderColor: "divider", borderRadius: 1, p: 2, mb: 1 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <TextField
            size="small"
            label="Title"
            value={part.title}
            onChange={(e) => onUpdate({ ...part, title: e.target.value })}
            sx={{ width: 200 }}
          />
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={onAddChild}>
            Add Sub-part
          </Button>
          <IconButton size="small" color="error" onClick={onRemove}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>
      <Collapse in={expanded}>
        <Stack spacing={2}>
          <TextField
            label="Prompt HTML / LaTeX"
            multiline
            minRows={4}
            value={localPrompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            fullWidth
            placeholder="Enter question text, use $$...$$ for KaTeX math"
          />
          <TextField
            size="small"
            type="number"
            label="Marks"
            value={part.marks ?? ""}
            onChange={(e) => onUpdate({ ...part, marks: e.target.value ? parseInt(e.target.value) : null })}
            sx={{ width: 120 }}
            inputProps={{ min: 0, max: 99 }}
          />
          {part.children.map((child) => (
            <PartNode
              key={child.id}
              part={child}
              depth={depth + 1}
              onUpdate={(updated) => {
                const idx = part.children.findIndex((c) => c.id === updated.id);
                if (idx >= 0) {
                  const newChildren = [...part.children];
                  newChildren[idx] = updated;
                  onUpdate({ ...part, children: newChildren });
                }
              }}
              onRemove={() => {
                onUpdate({ ...part, children: part.children.filter((c) => c.id !== child.id) });
              }}
              onAddChild={() => {
                const newChild: Part = {
                  id: `new-${Date.now()}`,
                  node_type: "subpart",
                  title: "",
                  prompt_html: "",
                  marks: null,
                  children: [],
                };
                onUpdate({ ...part, children: [...part.children, newChild] });
              }}
            />
          ))}
        </Stack>
      </Collapse>
    </Box>
  );
}

function generateId(): string {
  return `part-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function ItemEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === "new" || !id;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [item, setItem] = useState<ItemData | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [title, setTitle] = useState("");
  const [stimulusHtml, setStimulusHtml] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | "">("");
  const [isParameterizable, setIsParameterizable] = useState(false);
  const [itemType, setItemType] = useState("");
  const [difficultyNominal, setDifficultyNominal] = useState<number | "">("");
  const [parts, setParts] = useState<Part[]>([]);

  const fetchItem = useCallback(async () => {
    if (!id || isNew) return;
    setLoading(true);
    try {
      const res = await api.get(`/items/${id}`);
      const data = res.data.data;
      setItem(data);
      setTitle(data.attributes.title);
      setStimulusHtml(data.attributes.stimulus_html || "");
      setEstimatedMinutes(data.attributes.estimated_minutes ?? "");
      setIsParameterizable(data.attributes.is_parameterizable);
      setItemType(data.attributes.item_type || "");
      setDifficultyNominal(data.attributes.difficulty_nominal ?? "");
      setParts([]);
    } catch {
      setError("Failed to load item");
    } finally {
      setLoading(false);
    }
  }, [id, isNew]);

  useEffect(() => {
    if (!isNew) {
      fetchItem();
    }
  }, [isNew, fetchItem]);

  const buildPayload = useCallback(() => {
    const payload: Record<string, unknown> = {
      title,
      stimulus_html: stimulusHtml,
      prompt_html: parts.length > 0 ? parts[0].prompt_html : "",
      estimated_minutes: estimatedMinutes || null,
      is_parameterizable: isParameterizable,
      item_type: itemType || null,
      difficulty_nominal: difficultyNominal || null,
      node_type: 0,
      status: 0,
      department_id: 1,
    };
    return payload;
  }, [title, stimulusHtml, parts, estimatedMinutes, isParameterizable, itemType, difficultyNominal]);

  const autosave = useCallback(async () => {
    if (isNew || !id || saving) return;
    setSaving(true);
    try {
      const res = await api.post(`/items/${id}/autosave`, buildPayload());
      setItem(res.data.data);
    } catch {
      // silent autosave failure
    } finally {
      setSaving(false);
    }
  }, [id, isNew, buildPayload, saving]);

  const handleManualSave = async () => {
    setSaving(true);
    setError("");
    try {
      let res;
      if (isNew) {
        res = await api.post("/items", buildPayload());
      } else if (id) {
        res = await api.put(`/items/${id}`, buildPayload());
      }
      if (res) {
        setItem(res.data.data);
        if (isNew) {
          navigate(`/items/${res.data.data.id}/edit`);
        }
      }
    } catch {
      setError("Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || isNew || !confirm("Are you sure you want to delete this item?")) return;
    try {
      await api.delete(`/items/${id}`);
      navigate("/items");
    } catch {
      setError("Failed to delete item");
    }
  };

  useEffect(() => {
    if (isNew) return;
    const timer = setTimeout(() => {
      autosave();
    }, 3000);
    return () => clearTimeout(timer);
  }, [title, stimulusHtml, parts, estimatedMinutes, isParameterizable, itemType, difficultyNominal, isNew, autosave]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const addPart = () => {
    const newPart: Part = {
      id: generateId(),
      node_type: "question",
      title: `Part ${parts.length + 1}`,
      prompt_html: "",
      marks: null,
      children: [],
    };
    setParts([...parts, newPart]);
  };

  const updatePart = (updated: Part) => {
    setParts(parts.map((p) => (p.id === updated.id ? updated : p)));
  };

  const removePart = (id: string) => {
    setParts(parts.filter((p) => p.id !== id));
  };

  const totalMarks = parts.reduce((sum, p) => sum + (p.marks || 0) + p.children.reduce((s, c) => s + (c.marks || 0), 0), 0);

  if (loading) {
    return <Container maxWidth="lg"><Typography>Loading...</Typography></Container>;
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h4">{isNew ? "New Item" : "Item Editor"}</Typography>
        <Stack direction="row" spacing={1}>
          {saving && <Typography variant="caption" sx={{ alignSelf: "center" }}>Saving...</Typography>}
          {!isNew && (
            <Button variant="outlined" onClick={handleDelete} color="error">Delete</Button>
          )}
          <Button variant="contained" onClick={handleManualSave} disabled={saving}>
            {isNew ? "Create" : "Save"}
          </Button>
        </Stack>
      </Box>
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      <Box sx={{ mt: 3 }}>
        <TextField
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tab label="Stimulus" />
          <Tab label={`Parts (${parts.length})`} />
          <Tab label="Preview" />
        </Tabs>
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Stimulus HTML / LaTeX"
              multiline
              minRows={8}
              value={stimulusHtml}
              onChange={(e) => setStimulusHtml(e.target.value)}
              fullWidth
              placeholder="Global stimulus passage. Use $$...$$ for KaTeX math."
            />
            <Stack direction="row" spacing={2}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Item Type</InputLabel>
                <Select value={itemType} label="Item Type" onChange={(e) => setItemType(e.target.value)}>
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="multiple_choice">Multiple Choice</MenuItem>
                  <MenuItem value="short_answer">Short Answer</MenuItem>
                  <MenuItem value="essay">Essay</MenuItem>
                  <MenuItem value="calculation">Calculation</MenuItem>
                </Select>
              </FormControl>
              <TextField
                size="small"
                type="number"
                label="Estimated Minutes"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value ? parseInt(e.target.value) : "")}
                sx={{ width: 150 }}
                inputProps={{ min: 1 }}
              />
              <TextField
                size="small"
                type="number"
                label="Difficulty (1-10)"
                value={difficultyNominal}
                onChange={(e) => setDifficultyNominal(e.target.value ? parseInt(e.target.value) : "")}
                sx={{ width: 150 }}
                inputProps={{ min: 1, max: 10 }}
              />
              <label>
                <input type="checkbox" checked={isParameterizable} onChange={(e) => setIsParameterizable(e.target.checked)} />
                Parameterizable
              </label>
            </Stack>
          </Box>
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="subtitle1">Question Parts</Typography>
            <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={addPart}>
              Add Part
            </Button>
          </Box>
          {parts.length === 0 && (
            <Alert severity="info">No parts yet. Add a part to structure your question.</Alert>
          )}
          {parts.map((part) => (
            <PartNode
              key={part.id}
              part={part}
              depth={0}
              onUpdate={updatePart}
              onRemove={() => removePart(part.id)}
              onAddChild={() => {
                const newChild: Part = {
                  id: `new-${Date.now()}`,
                  node_type: "subpart",
                  title: `Sub-part ${part.children.length + 1}`,
                  prompt_html: "",
                  marks: null,
                  children: [],
                };
                updatePart({ ...part, children: [...part.children, newChild] });
              }}
            />
          ))}
          {parts.length > 0 && (
            <Box sx={{ mt: 2, p: 1, bgcolor: "background.paper", borderRadius: 1 }}>
              <Typography variant="body2">Total marks: <strong>{totalMarks}</strong></Typography>
            </Box>
          )}
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 3, minHeight: 400 }}>
            <Typography variant="h5" gutterBottom>{title || "Untitled"}</Typography>
            {stimulusHtml && (
              <Box sx={{ mb: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                <div dangerouslySetInnerHTML={{ __html: stimulusHtml }} />
              </Box>
            )}
            {parts.map((part) => (
              <Box key={part.id} sx={{ mb: 3 }}>
                <Typography variant="h6">{part.title}</Typography>
                <Box sx={{ mt: 1 }} dangerouslySetInnerHTML={{ __html: part.prompt_html }} />
                {part.marks !== null && (
                  <Typography variant="caption" color="text.secondary">[{part.marks} marks]</Typography>
                )}
                {part.children.map((child) => (
                  <Box key={child.id} sx={{ ml: 3, mt: 1, mb: 2 }}>
                    <Typography variant="subtitle1">{child.title}</Typography>
                    <Box sx={{ mt: 0.5 }} dangerouslySetInnerHTML={{ __html: child.prompt_html }} />
                    {child.marks !== null && (
                      <Typography variant="caption" color="text.secondary">[{child.marks} marks]</Typography>
                    )}
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        </TabPanel>
      </Box>
    </Container>
  );
}