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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      {/* Elementos decorativos modernos */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[10%] left-[15%] w-72 h-72 bg-brand-400/10 dark:bg-brand-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[20%] right-[10%] w-80 h-80 bg-brand-500/10 dark:bg-brand-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-[40%] right-[25%] w-64 h-64 bg-jade-400/10 dark:bg-jade-500/10 rounded-full blur-3xl"></div>
        
        {/* Grade sutil de fundo */}
        <div className="absolute inset-0 bg-grid-gray-300/20 dark:bg-grid-gray-700/20 bg-[size:20px_20px]"></div>
      </div>
      
      <div className="w-full max-w-md z-10">
        {/* Alert Toast */}
        {alert.open && (
          <div className={`mb-6 animate-fadeIn ${
            alert.type === "success" ? "bg-jade-50 dark:bg-jade-900/30 border-jade-200 dark:border-jade-800" : 
            alert.type === "error" ? "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800" : 
            alert.type === "warning" ? "bg-sunset-50 dark:bg-sunset-900/30 border-sunset-200 dark:border-sunset-800" : 
            "bg-brand-50 dark:bg-brand-900/30 border-brand-200 dark:border-brand-800"
          } rounded-xl p-4 border shadow-md`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {alert.type === "success" && <CheckCircleIcon className="h-5 w-5 text-jade-500" />}
                {alert.type === "error" && <XCircleIcon className="h-5 w-5 text-red-500" />}
                {alert.type === "warning" && <ExclamationCircleIcon className="h-5 w-5 text-sunset-500" />}
                {alert.type === "info" && <ExclamationCircleIcon className="h-5 w-5 text-brand-500" />}
              </div>
              <div className="ml-3">
                <p className={`text-sm ${
                  alert.type === "success" ? "text-jade-800 dark:text-jade-300" : 
                  alert.type === "error" ? "text-red-800 dark:text-red-300" : 
                  alert.type === "warning" ? "text-sunset-800 dark:text-sunset-300" : 
                  "text-brand-800 dark:text-brand-300"
                }`}>
                  {alert.message}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="glassmorphism p-8 border border-gray-200/50 dark:border-gray-700/30">
          {/* Logo e cabeçalho */}
          <div className="flex flex-col items-center">
            <div className="bg-gradient-to-br from-brand-500 to-brand-700 p-3 rounded-xl shadow-lg shadow-brand-500/20 dark:shadow-brand-500/10 mb-6">
              <svg className="w-8 h-8 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 7h-9m9 10h-9m9-5h-9M7 7v10l-2-2" />
              </svg>
            </div>
            <h1 className="heading-lg bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-brand-800 dark:from-brand-400 dark:to-brand-200 mb-1 text-center">
              PWA Kastor
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Sistema Integrado de Gestão e Produção
            </p>
            <h2 className="heading-sm mb-6 text-gray-900 dark:text-gray-100">
              {isLogin ? "Bem-vindo de volta" : "Crie sua conta"}
            </h2>

            <form onSubmit={handleAuth} className="w-full space-y-5">
              <div className="input-group">
                <label
                  htmlFor="email"
                  className="input-label"
                >
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-primary !pl-10"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div className="input-group">
                <label
                  htmlFor="password"
                  className="input-label"
                >
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-primary !pl-10"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5 !bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 dark:from-brand-600 dark:to-brand-700 dark:hover:from-brand-700 dark:hover:to-brand-800"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 
                      border-2 border-white dark:border-white/90 border-t-transparent dark:border-t-transparent mr-2">
                    </div>
                    Carregando...
                  </div>
                ) : isLogin ? (
                  "Entrar no Sistema"
                ) : (
                  "Criar Conta"
                )}
              </button>

              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700/30">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    resetFields();
                  }}
                  className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
                >
                  {isLogin
                    ? "Não tem uma conta? Registre-se"
                    : "Já tem uma conta? Faça login"}
                </button>
                
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setShowResetModal(true)}
                    className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
        
        {/* Rodapé */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} PWA Kastor • v0.1.2 • Todos os direitos reservados
          </p>
        </div>
      </div>

      {/* Password Reset Modal refinado */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-300">
          <div className="glassmorphism w-full max-w-md p-6 animate-modalEntry">
            <button
              onClick={() => setShowResetModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <XCircleIcon className="h-5 w-5" />
            </button>
            
            <div className="flex items-center mb-4">
              <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg mr-3">
                <svg className="h-5 w-5 text-brand-600 dark:text-brand-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h3 className="heading-sm text-gray-900 dark:text-white">
                Recuperar Senha
              </h3>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Insira seu email e enviaremos um link para redefinir sua senha.
            </p>
            
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="input-group">
                <label
                  htmlFor="reset-email"
                  className="input-label"
                >
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    id="reset-email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    className="input-primary !pl-10"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={resetLoading}
                className="btn-primary w-full py-2.5 !bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800"
              >
                {resetLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 
                      border-2 border-white dark:border-white/90 border-t-transparent dark:border-t-transparent mr-2">
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
    </div>
  );
}
