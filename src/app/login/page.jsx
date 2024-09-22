"use client";
import { useState } from "react";
import { supabase } from "../../supabaseClient";
import { useRouter } from "next/navigation";
import {
  TextField,
  Button,
  Box,
  Typography,
  Container,
  Link,
  Snackbar,
  Alert,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#175C7C",
    },
    secondary: {
      main: "#51A3E7",
    },
  },
});

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const router = useRouter();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        if (error.message.includes("Email rate limit exceeded")) {
          setSnackbar({
            open: true,
            message:
              "Muitas tentativas de login. Por favor, tente novamente mais tarde.",
            severity: "warning",
          });
        } else {
          setSnackbar({
            open: true,
            message: error.message,
            severity: "error",
          });
        }
      } else {
        router.push("/");
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        if (error.message.includes("User already registered")) {
          setSnackbar({
            open: true,
            message: "Este email já está registrado. Por favor, faça login.",
            severity: "warning",
          });
          setIsLogin(true); // Muda para o modo de login
        } else {
          setSnackbar({
            open: true,
            message: error.message,
            severity: "error",
          });
        }
      } else if (data?.user) {
        if (data.session) {
          // O usuário foi registrado e logado automaticamente
          setSnackbar({
            open: true,
            message: "Registro bem-sucedido! Você será redirecionado em breve.",
            severity: "success",
          });
          setTimeout(() => router.push("/"), 2000);
        } else {
          // O usuário foi registrado, mas precisa confirmar o email
          setSnackbar({
            open: true,
            message:
              "Registro bem-sucedido! Por favor, verifique seu email para confirmar a conta.",
            severity: "success",
          });
          setIsLogin(true); // Muda para o modo de login após o registro bem-sucedido
        }
      }
    }

    setLoading(false);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const resetFields = () => {
    setEmail("");
    setPassword("");
  };

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography
            component="h1"
            variant="h4"
            sx={{
              mb: 4,
              fontWeight: "bold",
              color: "primary.main",
              textAlign: "center",
            }}
          >
            Pesagem Novamed
          </Typography>
          <Box
            sx={{
              width: "100%",
              backgroundColor: "white",
              padding: 3,
              borderRadius: 2,
              boxShadow: 3,
            }}
          >
            <Typography component="h2" variant="h5" sx={{ mb: 2 }}>
              {isLogin ? "Login" : "Registro"}
            </Typography>
            <Box component="form" onSubmit={handleAuth} noValidate>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                size="small"
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Senha"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                size="small"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? "Carregando..." : isLogin ? "Entrar" : "Registrar"}
              </Button>
              <Link
                component="button"
                variant="body2"
                onClick={() => {
                  setIsLogin(!isLogin);
                  resetFields();
                }}
                sx={{ display: "block", textAlign: "center" }}
              >
                {isLogin
                  ? "Não tem uma conta? Registre-se"
                  : "Já tem uma conta? Faça login"}
              </Link>
            </Box>
          </Box>
        </Box>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
}
