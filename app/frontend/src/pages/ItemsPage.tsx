import { useEffect, useState } from "react";
import {
  Container, Typography, Button, Box, Card, CardContent,
  Grid, CircularProgress, Alert, Stack, Chip
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

interface Item {
  type: string;
  id: string;
  attributes: {
    title: string;
    marks: number | null;
    status: number;
    node_type: number;
    created_at: string;
    updated_at: string;
  };
}

const STATUS_COLORS: Record<number, "default" | "info" | "warning" | "success" | "error"> = {
  0: "info",
  1: "warning",
  2: "error",
  3: "success",
  4: "default",
};

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/items")
      .then((res) => setItems(res.data.data))
      .catch(() => setError("Failed to load items"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Items
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Browse and manage your question bank
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} size="large" onClick={() => navigate("/items/new")}>
          New Item
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {items.map((item) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
              <Card
                sx={{
                  height: "100%",
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": { transform: "translateY(-4px)", boxShadow: 4 },
                }}
                onClick={() => navigate(`/items/${item.id}/edit`)}
              >
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: "primary.dark", color: "primary.contrastText", mt: 0.5 }}>
                      <EditIcon fontSize="small" />
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="h6" fontWeight={600} noWrap>
                        {item.attributes.title}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
                        <Chip
                          label={`Status: ${item.attributes.status}`}
                          size="small"
                          color={STATUS_COLORS[item.attributes.status] || "default"}
                          variant={STATUS_COLORS[item.attributes.status] === "default" ? "outlined" : "filled"}
                        />
                        {item.attributes.marks !== null && (
                          <Chip label={`${item.attributes.marks} marks`} size="small" variant="outlined" />
                        )}
                      </Stack>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                        ID: {item.id} &middot; Type: {item.attributes.node_type}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {items.length === 0 && !loading && (
            <Grid size={{ xs: 12 }}>
              <Alert severity="info">No items found. Create your first item to get started.</Alert>
            </Grid>
          )}
        </Grid>
      )}
    </Container>
  );
}
