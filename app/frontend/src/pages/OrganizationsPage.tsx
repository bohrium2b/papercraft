import { useEffect, useState } from "react";
import {
  Container, Typography, Button, Box, Card, CardContent,
  Grid, CircularProgress, Alert, Stack
} from "@mui/material";
import { Add as AddIcon, Business as BusinessIcon } from "@mui/icons-material";
import api from "../services/api";

interface Organization {
  type: string;
  id: string;
  attributes: {
    name: string;
    created_at: string;
    updated_at: string;
  };
}

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/organizations")
      .then((res) => setOrgs(res.data.data))
      .catch(() => setError("Failed to load organizations"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Organizations
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your institutions and school districts
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} size="large">
          New Organization
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {orgs.map((org) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={org.id}>
              <Card sx={{ height: "100%", transition: "transform 0.2s, box-shadow 0.2s", "&:hover": { transform: "translateY(-4px)", boxShadow: 4 } }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "primary.dark", color: "primary.contrastText" }}>
                      <BusinessIcon />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h6" fontWeight={600} noWrap>
                        {org.attributes.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {org.id}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {orgs.length === 0 && !loading && (
            <Grid size={{ xs: 12 }}>
              <Alert severity="info">No organizations found. Create one to get started.</Alert>
            </Grid>
          )}
        </Grid>
      )}
    </Container>
  );
}
