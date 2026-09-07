import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import App from "../src/App";

const customTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0C0D12', // Dark contrast button color
      light: '#27272A',
      dark: '#000000',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#6366F1', // Indigo accent color for chart accents
      light: '#818CF8',
      dark: '#4338CA',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#06B6D4', // Cyan color for progress bar
      light: '#22D3EE',
      dark: '#0891B2',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#10B981',
      light: '#34D399',
      dark: '#059669',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#F59E0B',
      light: '#FBBF24',
      dark: '#D97706',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#EEF2FB',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A',
      secondary: '#64748B',
      disabled: '#94A4B8',
    },
    divider: 'rgba(226, 232, 240, 0.9)',
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      letterSpacing: '-0.02em',
      color: '#0F172A',
    },
    h4: {
      fontWeight: 700,
      fontSize: '1.75rem',
      letterSpacing: '-0.02em',
      color: '#0F172A',
    },
    h5: {
      fontWeight: 700,
      fontSize: '1.35rem',
      letterSpacing: '-0.01em',
      color: '#0F172A',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      letterSpacing: '-0.005em',
      color: '#0F172A',
    },
    subtitle1: {
      fontSize: '0.875rem',
      color: '#64748B',
      fontWeight: 500,
    },
    subtitle2: {
      fontSize: '0.75rem',
      color: '#94A4B8',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    body1: {
      fontSize: '0.925rem',
      color: '#334155',
    },
    body2: {
      fontSize: '0.8125rem',
      color: '#64748B',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '0.875rem',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#D6DCFB',
          backgroundImage: 'radial-gradient(at 50% 0%, #E2E8FF 0%, #D2D8FB 100%)',
          minHeight: '100vh',
          color: '#0F172A',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 24,
          padding: '8px 20px',
          fontWeight: 600,
          transition: 'all 0.2s ease-in-out',
        },
        outlined: {
          borderColor: '#E2E8F0',
          backgroundColor: '#FFFFFF',
          color: '#334155',
          '&:hover': {
            borderColor: '#CBD5E1',
            backgroundColor: '#F8FAFC',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0px 4px 24px rgba(15, 23, 42, 0.03)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          backgroundColor: '#FFFFFF',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0px 4px 20px rgba(15, 23, 42, 0.03)',
        },
        elevation1: {
          boxShadow: '0px 2px 12px rgba(15, 23, 42, 0.04)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 50,
          fontWeight: 600,
          fontSize: '0.75rem',
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          paddingTop: '8px',
          paddingBottom: '8px',
          borderRadius: 12,
          fontSize: '0.875rem',
          fontWeight: 500,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: '#FFFFFF',
          '& fieldset': {
            borderColor: '#E2E8F0',
          },
          '&:hover fieldset': {
            borderColor: '#CBD5E1',
          },
        },
      },
    },
  },
});


ReactDOM.createRoot(document.getElementById("root")).render(
  React.createElement(React.StrictMode, null,
    React.createElement(ThemeProvider, { theme: customTheme },
      React.createElement(CssBaseline, null),
      React.createElement(BrowserRouter, null,
        React.createElement(App, null)
      )
    )
  )
);

