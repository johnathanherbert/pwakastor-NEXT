"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { useRouter } from "next/navigation";
import {
  ExclamationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  EyeSlashIcon
} from "@heroicons/react/24/outline";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState({
    open: false,
    message: "",
    type: "info", // success, error, warning, info
  });
  const [isReady, setIsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // This function handles the auth flow when the page loads
    const handleAuthFlow = async () => {
      // Make sure we're in the browser
      if (typeof window === 'undefined') return;
      
      console.log("Handling auth flow on page load");
      
      try {
        // First, check if we already have a session
        const { data: sessionData } = await supabase.auth.getSession();
        
        // If we have a session, we're ready to reset the password
        if (sessionData?.session) {
          console.log("Session found, ready to reset password");
          setIsReady(true);
          setIsProcessing(false);
          return;
        }
        
        // Get the URL parameters (type=recovery may be in hash or query)
        const hash = window.location.hash;
        const url = new URL(window.location.href);
        const queryParams = url.searchParams;
        
        // Log what we found for debugging
        console.log("URL hash:", hash);
        console.log("URL query parameters:", Object.fromEntries(queryParams.entries()));
        
        // Check if we have a recovery token in the hash
        if (hash && hash.includes('type=recovery')) {
          console.log("Found recovery parameters in hash");
          
          try {
            // Parse the hash parameters
            const hashParams = new URLSearchParams(hash.substring(1));
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');
            
            if (!accessToken) {
              throw new Error("Access token not found in URL");
            }
            
            // Set the session using the tokens
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || null,
            });
            
            if (error) throw error;
            
            console.log("Session set successfully");
            setIsReady(true);
          } catch (error) {
            console.error("Error processing hash parameters:", error);
            showAlert(`Erro no processamento do link: ${error.message}`, "error");
            // Don't redirect automatically - let the user try again or go back manually
          }
        } 
        // Check if we have parameters in the query string
        else if (queryParams.has('type') && queryParams.get('type') === 'recovery') {
          console.log("Found recovery parameters in query string");
          
          // The token might be in other parameters, but Supabase should handle this
          // Just let the user know we're processing
          showAlert("Processando seu link de recuperação...", "info");
          
          // Give Supabase a moment to process the URL parameters
          setTimeout(async () => {
            // Check if we have a session now
            const { data } = await supabase.auth.getSession();
            if (data?.session) {
              console.log("Session established after processing query parameters");
              setIsReady(true);
            } else {
              console.log("No session established after processing query parameters");
              showAlert("Não foi possível processar o link de recuperação.", "error");
            }
          }, 1000);
        } else {
          console.log("No recovery parameters found");
          showAlert("Link de recuperação inválido ou expirado.", "error");
          // Wait a moment before redirecting so the user can see the message
          setTimeout(() => router.push('/login'), 3000);
        }
      } catch (error) {
        console.error("Error in auth flow:", error);
        showAlert(`Erro: ${error.message}`, "error");
      } finally {
        setIsProcessing(false);
      }
    };

    handleAuthFlow();
  }, [router]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (newPassword.length < 6) {
      showAlert("A senha deve ter pelo menos 6 caracteres.", "warning");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showAlert("As senhas não coincidem.", "warning");
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        showAlert(`Erro ao redefinir senha: ${error.message}`, "error");
      } else {
        showAlert("Senha atualizada com sucesso!", "success");
        // Redirect to login page after a delay
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (error) {
      showAlert(`Erro ao processar sua solicitação: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, type) => {
    setAlert({ open: true, message, type });
    setTimeout(() => setAlert((prev) => ({ ...prev, open: false })), 6000);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Display a loading state while we process the recovery link
  if (isProcessing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Processando seu link de recuperação...
            </h1>
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 dark:border-blue-400"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show the password reset form only if we're ready
  if (isReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="flex flex-col items-center">
              <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-8 text-center">
                Pesagem Novamed
              </h1>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Redefinir Senha
              </h2>
              
              <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                Digite sua nova senha abaixo.
              </p>

              <form onSubmit={handleResetPassword} className="w-full space-y-4">
                <div>
                  <label
                    htmlFor="new-password"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Nova Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="new-password"
                      name="new-password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 
                        bg-white dark:bg-gray-700
                        border border-gray-200 dark:border-gray-600 
                        rounded-lg text-gray-900 dark:text-gray-100
                        placeholder-gray-400 dark:placeholder-gray-400
                        focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
                        focus:border-transparent transition-colors"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="confirm-password"
                      name="confirm-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 
                        bg-white dark:bg-gray-700
                        border border-gray-200 dark:border-gray-600 
                        rounded-lg text-gray-900 dark:text-gray-100
                        placeholder-gray-400 dark:placeholder-gray-400
                        focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
                        focus:border-transparent transition-colors"
                    />
                  </div>
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
                      Atualizando...
                    </div>
                  ) : (
                    "Redefinir Senha"
                  )}
                </button>
                
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    Voltar para o login
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If we're not processing and not ready, show an error state
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center">
            <h1 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">
              Link de recuperação inválido
            </h1>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
              Não foi possível processar seu link de recuperação de senha. Por favor, solicite um novo link.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="w-full py-2 px-4 bg-blue-600 dark:bg-blue-500 
                hover:bg-blue-700 dark:hover:bg-blue-600 
                text-white dark:text-white
                rounded-lg font-medium 
                transition-colors duration-200"
            >
              Voltar para o login
            </button>
          </div>
        </div>
      </div>

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
