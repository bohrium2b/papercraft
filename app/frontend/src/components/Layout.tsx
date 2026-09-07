import { useState } from "react";
import {
  Box, Drawer, AppBar, Toolbar, IconButton, Typography, useMediaQuery,
  List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider,
  Breadcrumbs, CircularProgress
} from "@mui/material";
import { useNavigate, useLocation, Outlet, Link } from "react-router-dom";
import {
  Menu as MenuIcon, ChevronLeft as ChevronLeftIcon,
  School as SchoolIcon, Domain as DepartmentIcon,
  People as PeopleIcon, Edit as EditIcon, Logout as LogoutIcon
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import api from "../services/api";

const DRAWER_WIDTH = 260;

const NAV_ITEMS = [
  { path: "/organizations", label: "Organizations", Icon: SchoolIcon },
  { path: "/departments", label: "Departments", Icon: DepartmentIcon },
  { path: "/users", label: "Users", Icon: PeopleIcon },
  { path: "/items", label: "Items", Icon: EditIcon },
];

export default function Layout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [open, setOpen] = useState(!isMobile);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await api.delete("/sessions");
    } catch {
      // best-effort logout
    } finally {
      window.location.href = "/login";
    }
  };

  const breadcrumbMap: Record<string, string> = {
    organizations: "Organizations",
    departments: "Departments",
    users: "Users",
    items: "Items",
  };

  const pathSegments = location.pathname.split("/").filter(Boolean);
  const pageTitle = pathSegments[0]
    ? breadcrumbMap[pathSegments[0]] || "Papercraft"
    : "Papercraft";

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ px: 2, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h6" fontWeight={700} letterSpacing="-0.02em">
          Papercraft
        </Typography>
        {isMobile && (
          <IconButton onClick={() => setOpen(false)} size="small">
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>
      <Divider />
      <List sx={{ flex: 1, px: 1, py: 2 }}>
        {NAV_ITEMS.map(({ path, label, Icon }) => {
          const selected = location.pathname.startsWith(path);
          return (
            <ListItem key={path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={selected}
                onClick={() => {
                  navigate(path);
                  if (isMobile) setOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  "&.Mui-selected": {
                    backgroundColor: "primary.dark",
                    color: "primary.contrastText",
                    "&:hover": { backgroundColor: "primary.dark" },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={label} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2, mx: 1 }}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Sign Out" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar variant="dense">
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setOpen(!open)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
            {pageTitle}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: open ? DRAWER_WIDTH : 0 }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant={isMobile ? "temporary" : "persistent"}
          open={open}
          onClose={() => setOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box" },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${open ? DRAWER_WIDTH : 0}px)` },
          ml: { sm: `${open ? DRAWER_WIDTH : 0}px` },
          transition: (t) => t.transitions.create(["width", "margin-left"], { easing: t.transitions.easing.sharp, duration: t.transitions.duration.leavingScreen }),
        }}
      >
        <Toolbar />
        <Breadcrumbs sx={{ mb: 2 }} aria-label="breadcrumb">
          <Link underline="hover" color="inherit" to="/organizations">
            Home
          </Link>
          {pathSegments.map((segment, idx) => (
            <Typography key={idx} color="text.primary">
              {breadcrumbMap[segment] || segment}
            </Typography>
          ))}
        </Breadcrumbs>
        <Outlet />
      </Box>
    </Box>
  );
}
