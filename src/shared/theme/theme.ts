import { createTheme } from "@mui/material/styles";
import { trTR } from "@mui/material/locale";
import { trTR as dataGridTrTR } from "@mui/x-data-grid/locales";

/**
 * The one MUI theme for itiarz: light/dark follow the operating system, Turkish texts for MUI and
 * DataGrid, compact density for an operations panel.
 */
export const theme = createTheme(
  {
    cssVariables: { colorSchemeSelector: "media" },
    colorSchemes: {
      light: { palette: { primary: { main: "#1f4e79" }, background: { default: "#f5f7fa" } } },
      dark: { palette: { primary: { main: "#7fb3e6" } } },
    },
    shape: { borderRadius: 6 },
    typography: { fontFamily: "system-ui, -apple-system, \"Segoe UI\", Roboto, sans-serif", fontSize: 13 },
    components: {
      MuiButton: { defaultProps: { size: "small", disableElevation: true } },
      MuiTextField: { defaultProps: { size: "small", fullWidth: true } },
      MuiAutocomplete: { defaultProps: { size: "small", fullWidth: true } },
    },
  },
  trTR,
  dataGridTrTR,
);

