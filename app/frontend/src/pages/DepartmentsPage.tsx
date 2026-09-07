import { useEffect, useState } from "react";
import {
  Container, Typography, Button, Box, Card, CardContent,
  Grid, CircularProgress, Alert, Stack, Chip
} from "@mui/material";
import { Add as AddIcon, Apartment as ApartmentIcon } from "@mui/icons-material";
import api from "../services/api";

interface Department {
  type: string;
  id: string;
  attributes: {
    name: string;
    organization_id: number;
    created_at: string;
    updated_at: string;
  };
}

export default function DepartmentsPage() {
  const [depts, setDepts] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/departments")
      .then((res) => setDepts(res.data.data))
      .catch(() => setError("Failed to load departments"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Departments
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Academic departments within your organizations
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} size="large">
          New Department
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {depts.map((dept) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={dept.id}>
              <Card sx={{ height: "100%", transition: "transform 0.2s, box-shadow 0.2s", "&:hover": { transform: "translateY(-4px)", boxShadow: 4 } }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "secondary.dark", color: "secondary.contrastText" }}>
                      <ApartmentIcon />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h6" fontWeight={600} noWrap>
                        {dept.attributes.name}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                        <Chip label={`Org ID: ${dept.attributes.organization_id}`} size="small" variant="outlined" />
                        <Chip label={`ID: ${dept.id}`} size="small" variant="outlined" />
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {depts.length === 0 && !loading && (
            <Grid size={{ xs: 12 }}>
              <Alert severity="info">No departments found. Create one to get started.</Alert>
            </Grid>
          )}
        </Grid>
      )}
    </Container>
  );
}
