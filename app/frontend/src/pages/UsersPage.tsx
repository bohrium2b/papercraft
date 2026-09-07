import { useEffect, useState } from "react";
import {
  Container, Typography, Button, Box, Card, CardContent,
  Grid, CircularProgress, Alert, Stack, Chip, Avatar
} from "@mui/material";
import { Add as AddIcon, Person as PersonIcon } from "@mui/icons-material";
import api from "../services/api";

interface User {
  type: string;
  id: string;
  attributes: {
    email: string;
    name: string;
    department_id: number;
    can_approve: boolean;
    created_at: string;
    updated_at: string;
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/users")
      .then((res) => setUsers(res.data.data))
      .catch(() => setError("Failed to load users"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Users
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage teachers, examiners, and administrators
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} size="large">
          New User
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {users.map((user) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={user.id}>
              <Card sx={{ height: "100%", transition: "transform 0.2s, box-shadow 0.2s", "&:hover": { transform: "translateY(-4px)", boxShadow: 4 } }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: "info.dark" }}>
                      <PersonIcon />
                    </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="h6" fontWeight={600} noWrap>
                        {user.attributes.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {user.attributes.email}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Chip
                          label={user.attributes.can_approve ? "Approver" : "Author"}
                          size="small"
                          color={user.attributes.can_approve ? "success" : "default"}
                          variant={user.attributes.can_approve ? "filled" : "outlined"}
                        />
                        <Chip label={`Dept: ${user.attributes.department_id}`} size="small" variant="outlined" />
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {users.length === 0 && !loading && (
            <Grid size={{ xs: 12 }}>
              <Alert severity="info">No users found. Invite users to get started.</Alert>
            </Grid>
          )}
        </Grid>
      )}
    </Container>
  );
}
