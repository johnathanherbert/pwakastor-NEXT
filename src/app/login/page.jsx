"use client";
import { useState } from "react";
import { supabase } from "../../supabaseClient";
import { useRouter } from "next/navigation";
import {
  ExclamationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);
  const [alert, setAlert] = useState({
    open: false,
    message: "",
    type: "info", // success, error, warning, info
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
          showAlert(
            "Muitas tentativas de login. Por favor, tente novamente mais tarde.",
            "warning"
          );
        } else {
          showAlert(error.message, "error");
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
          showAlert(
            "Este email já está registrado. Por favor, faça login.",
            "warning"
          );
          setIsLogin(true);
        } else {
          showAlert(error.message, "error");
        }
      } else if (data?.user) {
        if (data.session) {
          showAlert(
            "Registro bem-sucedido! Você será redirecionado em breve.",
            "success"
          );
          setTimeout(() => router.push("/"), 2000);
        } else {
          showAlert(
            "Registro bem-sucedido! Por favor, verifique seu email para confirmar a conta.",
            "success"
          );
          setIsLogin(true);
        }
      }
    }

    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    
    try {
      // Make sure the URL is absolute and correctly formatted
      const resetUrl = new URL('/reset-password', window.location.origin).toString();
      
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: resetUrl,
      });
      
      if (error) {
        showAlert(`Erro ao enviar email de recuperação: ${error.message}`, "error");
      } else {
        showAlert("Email de recuperação enviado com sucesso! Verifique sua caixa de entrada.", "success");
        setShowResetModal(false);
        setResetEmail("");
      }
    } catch (error) {
      showAlert(`Erro ao processar sua solicitação: ${error.message}`, "error");
    } finally {
      setResetLoading(false);
    }
  };

  const showAlert = (message, type) => {
    setAlert({ open: true, message, type });
    setTimeout(() => setAlert({ ...alert, open: false }), 6000);
  };

  const resetFields = () => {
    setEmail("");
    setPassword("");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center">
            <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-8 text-center">
              Pesagem Novamed
            </h1>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              {isLogin ? "Login" : "Registro"}
            </h2>

            <form onSubmit={handleAuth} className="w-full space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 
                    bg-white dark:bg-gray-700
                    border border-gray-200 dark:border-gray-600 
                    rounded-lg text-gray-900 dark:text-gray-100
                    placeholder-gray-400 dark:placeholder-gray-400
                    focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
                    focus:border-transparent transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Senha
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 
                    bg-white dark:bg-gray-700
                    border border-gray-200 dark:border-gray-600 
                    rounded-lg text-gray-900 dark:text-gray-100
                    placeholder-gray-400 dark:placeholder-gray-400
                    focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
                    focus:border-transparent transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-blue-600 dark:bg-blue-500 
                  hover:bg-blue-700 dark:hover:bg-blue-600 
                  text-white dark:text-white
                  rounded-full font-medium 
                  transition-colors duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 
                      border-t-2 border-b-2 border-white dark:border-white/90 mr-2">
                    </div>
                    Carregando...
                  </div>
                ) : isLogin ? (
                  "Entrar"
                ) : (
                  "Registrar"
                )}
              </button>

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    resetFields();
                  }}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  {isLogin
                    ? "Não tem uma conta? Registre-se"
                    : "Já tem uma conta? Faça login"}
                </button>
                
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setShowResetModal(true)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <button
              onClick={() => setShowResetModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <XCircleIcon className="h-5 w-5" />
            </button>
            
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Recuperar Senha
            </h3>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Insira seu email e enviaremos um link para redefinir sua senha.
            </p>
            
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label
                  htmlFor="reset-email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="reset-email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 
                    bg-white dark:bg-gray-700
                    border border-gray-200 dark:border-gray-600 
                    rounded-lg text-gray-900 dark:text-gray-100
                    placeholder-gray-400 dark:placeholder-gray-400
                    focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
                    focus:border-transparent transition-colors"
                />
              </div>
              
              <button
                type="submit"
                disabled={resetLoading}
                className="w-full py-2 px-4 bg-blue-600 dark:bg-blue-500 
                  hover:bg-blue-700 dark:hover:bg-blue-600 
                  text-white dark:text-white
                  rounded-lg font-medium 
                  transition-colors duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resetLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 
                      border-t-2 border-b-2 border-white dark:border-white/90 mr-2">
                    </div>
                    Enviando...
                  </div>
                ) : (
                  "Enviar link de recuperação"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Alert */}
      {alert.open && (
        <div className="fixed bottom-4 right-4 max-w-md">
          <div
            className={`rounded-lg p-4 flex items-center 
              shadow-lg dark:shadow-slate-900/30 ${
              alert.type === "success"
                ? "bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                : alert.type === "error"
                ? "bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                : "bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
            }`}
          >
            {alert.type === "success" && (
              <CheckCircleIcon className="h-5 w-5 mr-2" />
            )}
            {alert.type === "error" && <XCircleIcon className="h-5 w-5 mr-2" />}
            {alert.type === "warning" && (
              <ExclamationCircleIcon className="h-5 w-5 mr-2" />
            )}
            <p>{alert.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
