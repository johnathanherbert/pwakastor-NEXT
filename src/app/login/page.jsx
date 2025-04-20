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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
      {/* Círculos decorativos */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[10%] left-[15%] w-64 h-64 bg-blue-400/10 dark:bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[20%] right-[10%] w-80 h-80 bg-indigo-400/10 dark:bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="w-full max-w-md z-10">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-gray-200/50 dark:border-gray-700/30">
          {/* Logo e cabeçalho */}
          <div className="flex flex-col items-center">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-3 rounded-xl shadow-lg shadow-blue-600/20 dark:shadow-blue-500/10 mb-6">
              <svg className="w-8 h-8 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 7h-9m9 10h-9m9-5h-9M7 7v10l-2-2" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 mb-1 text-center">
              PWA Kastor
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Sistema Integrado de Gestão Hospitalar
            </p>
            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
              {isLogin ? "Bem-vindo de volta" : "Crie sua conta"}
            </h2>

            <form onSubmit={handleAuth} className="w-full space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
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
                    className="pl-10 mt-1 block w-full px-3 py-2.5
                      bg-white/60 dark:bg-gray-700/60
                      border border-gray-200 dark:border-gray-600 
                      rounded-lg text-gray-900 dark:text-gray-100
                      placeholder-gray-400 dark:placeholder-gray-400
                      focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 
                      focus:border-transparent transition-colors"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
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
                    className="pl-10 mt-1 block w-full px-3 py-2.5
                      bg-white/60 dark:bg-gray-700/60
                      border border-gray-200 dark:border-gray-600 
                      rounded-lg text-gray-900 dark:text-gray-100
                      placeholder-gray-400 dark:placeholder-gray-400
                      focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 
                      focus:border-transparent transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 
                  hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600
                  text-white dark:text-white
                  rounded-lg font-medium shadow-md shadow-blue-500/20 dark:shadow-blue-500/10
                  transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  {isLogin
                    ? "Não tem uma conta? Registre-se"
                    : "Já tem uma conta? Faça login"}
                </button>
                
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setShowResetModal(true)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
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
            &copy; {new Date().getFullYear()} PWA Kastor • v0.1.0 • Todos os direitos reservados
          </p>
        </div>
      </div>

      {/* Password Reset Modal aprimorado */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-300">
          <div className="relative w-full max-w-md bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-xl p-6 border border-gray-200/50 dark:border-gray-700/30 animate-fadeIn" style={{ animationDuration: '0.3s' }}>
            <button
              onClick={() => setShowResetModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <XCircleIcon className="h-5 w-5" />
            </button>
            
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Recuperar Senha
              </h3>
            </div>
            
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
                    className="pl-10 block w-full px-3 py-2.5 
                      bg-white/60 dark:bg-gray-700/60
                      border border-gray-200 dark:border-gray-600 
                      rounded-lg text-gray-900 dark:text-gray-100
                      placeholder-gray-400 dark:placeholder-gray-400
                      focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 
                      focus:border-transparent transition-colors"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={resetLoading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 
                  hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 
                  text-white dark:text-white
                  rounded-lg font-medium shadow-md shadow-blue-500/10 dark:shadow-blue-500/5
                  transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed"
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
