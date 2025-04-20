"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../supabaseClient";
import { useTheme } from "@/contexts/ThemeContext";
import Link from "next/link";

// Icons
import {
  ArrowRightIcon,
  BeakerIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowLeftOnRectangleIcon,
  UserCircleIcon,
  ChevronRightIcon,
  BuildingStorefrontIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";

// Components
import UserMenu from "@/components/UserMenu";
import Sidebar from "@/components/Sidebar";

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stats, setStats] = useState({
    ordens: 0,
    paletes: 0,
    devolucoes: 0,
    materiais: 0
  });
  const { darkMode, toggleDarkMode } = useTheme();
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }
        setUser(user);
        fetchDashboardStats();
      } catch (error) {
        console.error("Erro ao verificar usuário:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [router]);

  const fetchDashboardStats = async () => {
    try {
      // Consulta para contar ordens (baseado no estado salvo)
      const { data: appStateData, error: appStateError } = await supabase
        .from("app_state")
        .select("state")
        .limit(1);

      // Consulta para contar paletes ocupados
      const { data: paletesData, error: paletesError } = await supabase
        .from("storage_spaces")
        .select("id")
        .eq("status", "occupied");

      // Consulta para contar materiais únicos
      const { data: materiaisData, error: materiaisError } = await supabase
        .from("DataBase_ems")
        .select("Ativo")
        .limit(1);

      // Consulta para contar devoluções
      const { data: devolucoesData, error: devolucoesError } = await supabase
        .from("app_state")
        .select("state")
        .like("state->devolucao", "%");

      // Atualizando estatísticas
      setStats({
        ordens: appStateData?.[0]?.state?.ordens?.length || 0,
        paletes: paletesData?.length || 0,
        devolucoes: devolucoesData?.length || 0,
        materiais: materiaisData?.length || 0
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            PWA Kastor
          </h1>
        </div>
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-t-2 border-blue-500 animate-spin"></div>
          <div className="absolute inset-1 rounded-full border-r-2 border-indigo-600 animate-spin animation-delay-150"></div>
          <div className="absolute inset-2 rounded-full border-b-2 border-purple-500 animate-spin animation-delay-300"></div>
        </div>
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Carregando...</p>
      </div>
    );
  }

  const modules = [
    {
      title: "Solicitações",
      description: "Gerencie ordens de produção e controle de pesagem de excipientes",
      icon: <BeakerIcon className="h-8 w-8" />,
      path: "/solicitacoes",
      color: "from-blue-500 to-sky-600"
    },
    {
      title: "Gestão de Armazenamento",
      description: "Controle de paletes e locais de armazenamento",
      icon: <ClipboardDocumentCheckIcon className="h-8 w-8" />,
      path: "/gestao",
      color: "from-emerald-500 to-green-600"
    },
    {
      title: "Devolução de Materiais",
      description: "Processo de devolução e controle de estoque",
      icon: <TruckIcon className="h-8 w-8" />,
      path: "/devolucao",
      color: "from-amber-500 to-orange-600"
    },
    {
      title: "Alocação Mobile",
      description: "Gestão de alocação otimizada para dispositivos móveis",
      icon: <UserCircleIcon className="h-8 w-8" />,
      path: "/alocacao-mobile",
      color: "from-indigo-500 to-purple-600"
    },
    {
      title: "Análise de Aging",
      description: "Acompanhamento de materiais por tempo de armazenamento",
      icon: <ArrowTrendingUpIcon className="h-8 w-8" />,
      path: "/aging",
      color: "from-rose-500 to-pink-600"
    },
    {
      title: "Almoxarifado",
      description: "Gestão de inventário e notas técnicas",
      icon: <BuildingStorefrontIcon className="h-8 w-8" />,
      path: "/almoxarifado/nts",
      color: "from-purple-500 to-violet-600"
    }
  ];

  const recentActivities = [
    { description: "Paletes realocados recentemente", count: Math.floor(Math.random() * 10) + 5, path: "/gestao" },
    { description: "Solicitações realizadas hoje", count: Math.floor(Math.random() * 15) + 10, path: "/solicitacoes" },
    { description: "Devoluções processadas", count: Math.floor(Math.random() * 8) + 3, path: "/devolucao" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => setDrawerOpen(!drawerOpen)}
                className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
                aria-label="Toggle sidebar"
              >
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="ml-4 flex items-center">
                <svg width="24" height="24" viewBox="0 0 24 24" className="text-blue-600 dark:text-blue-400" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                </svg>
                <h1 className="ml-2 text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-400">
                  PWA Kastor
                </h1>
                <div className="ml-3 flex items-center">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="ml-1.5 text-xs text-green-600 dark:text-green-400 font-medium hidden sm:inline-flex">Online</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {user && <UserMenu user={user} onUserUpdate={setUser} />}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
        
        <main className="flex-1 p-6 lg:p-8">
          {/* Dashboard Title */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Bem-vindo ao sistema de gerenciamento PWA Kastor, {user?.email.split('@')[0]}!
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 overflow-hidden relative group hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-300">
              <div className="absolute top-0 right-0 mt-4 mr-4 text-blue-500 dark:text-blue-400">
                <BeakerIcon className="h-8 w-8 opacity-20 group-hover:opacity-30 transition-opacity" />
              </div>
              <div className="relative z-10">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ordens em Andamento</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {stats.ordens}
                </p>
                <div className="h-1 w-16 bg-gradient-to-r from-blue-400 to-blue-600 rounded mt-3 group-hover:w-20 transition-all"></div>
                <Link href="/solicitacoes" className="inline-flex items-center mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  Ver detalhes <ChevronRightIcon className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-0 group-hover:opacity-5 transition-opacity rounded-xl"></div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 overflow-hidden relative group hover:shadow-md hover:border-green-200 dark:hover:border-green-700 transition-all duration-300">
              <div className="absolute top-0 right-0 mt-4 mr-4 text-green-500 dark:text-green-400">
                <ClipboardDocumentCheckIcon className="h-8 w-8 opacity-20 group-hover:opacity-30 transition-opacity" />
              </div>
              <div className="relative z-10">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Paletes Ocupados</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                  {stats.paletes}
                </p>
                <div className="h-1 w-16 bg-gradient-to-r from-green-400 to-green-600 rounded mt-3 group-hover:w-20 transition-all"></div>
                <Link href="/gestao" className="inline-flex items-center mt-4 text-sm text-green-600 dark:text-green-400 hover:underline">
                  Ver detalhes <ChevronRightIcon className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 opacity-0 group-hover:opacity-5 transition-opacity rounded-xl"></div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 overflow-hidden relative group hover:shadow-md hover:border-amber-200 dark:hover:border-amber-700 transition-all duration-300">
              <div className="absolute top-0 right-0 mt-4 mr-4 text-amber-500 dark:text-amber-400">
                <TruckIcon className="h-8 w-8 opacity-20 group-hover:opacity-30 transition-opacity" />
              </div>
              <div className="relative z-10">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Devoluções</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {stats.devolucoes}
                </p>
                <div className="h-1 w-16 bg-gradient-to-r from-amber-400 to-amber-600 rounded mt-3 group-hover:w-20 transition-all"></div>
                <Link href="/devolucao" className="inline-flex items-center mt-4 text-sm text-amber-600 dark:text-amber-400 hover:underline">
                  Ver detalhes <ChevronRightIcon className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-amber-600 opacity-0 group-hover:opacity-5 transition-opacity rounded-xl"></div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 overflow-hidden relative group hover:shadow-md hover:border-purple-200 dark:hover:border-purple-700 transition-all duration-300">
              <div className="absolute top-0 right-0 mt-4 mr-4 text-purple-500 dark:text-purple-400">
                <ClockIcon className="h-8 w-8 opacity-20 group-hover:opacity-30 transition-opacity" />
              </div>
              <div className="relative z-10">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Materiais</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {stats.materiais}
                </p>
                <div className="h-1 w-16 bg-gradient-to-r from-purple-400 to-purple-600 rounded mt-3 group-hover:w-20 transition-all"></div>
                <Link href="/aging" className="inline-flex items-center mt-4 text-sm text-purple-600 dark:text-purple-400 hover:underline">
                  Ver análise de aging <ChevronRightIcon className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 opacity-0 group-hover:opacity-5 transition-opacity rounded-xl"></div>
            </div>
          </div>

          {/* Módulos Grid */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <svg className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              Módulos do Sistema
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((module, index) => (
                <Link
                  key={index}
                  href={module.path}
                  className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 hover:scale-[1.02] hover:-translate-y-1 overflow-hidden"
                >
                  <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${module.color} text-white mb-4 shadow-sm relative z-10`}>
                    {module.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors relative z-10">
                    {module.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 relative z-10">
                    {module.description}
                  </p>
                  <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium relative z-10">
                    <span>Acessar módulo</span>
                    <ArrowRightIcon className="ml-2 h-4 w-4 transform transition-transform group-hover:translate-x-1" />
                  </div>
                  <div className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-0 group-hover:opacity-5 transition-opacity rounded-xl`}></div>
                </Link>
              ))}
            </div>
          </div>
          
          {/* Ações Rápidas */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <svg className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Ações Rápidas
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <Link href="/solicitacoes" className="group flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-all duration-200 hover:shadow hover:border-blue-200 dark:hover:border-blue-900">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40 transition-colors">
                  <BeakerIcon className="h-5 w-5" />
                </div>
                <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">Nova Ordem</span>
              </Link>
              
              <Link href="/gestao" className="group flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-all duration-200 hover:shadow hover:border-green-200 dark:hover:border-green-900">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 group-hover:bg-green-200 dark:group-hover:bg-green-800/40 transition-colors">
                  <ClipboardDocumentCheckIcon className="h-5 w-5" />
                </div>
                <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">Verificar Paletes</span>
              </Link>
              
              <Link href="/devolucao" className="group flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-all duration-200 hover:shadow hover:border-amber-200 dark:hover:border-amber-900">
                <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 group-hover:bg-amber-200 dark:group-hover:bg-amber-800/40 transition-colors">
                  <TruckIcon className="h-5 w-5" />
                </div>
                <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">Nova Devolução</span>
              </Link>
              
              <Link href="/aging" className="group flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-all duration-200 hover:shadow hover:border-purple-200 dark:hover:border-purple-900">
                <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 group-hover:bg-purple-200 dark:group-hover:bg-purple-800/40 transition-colors">
                  <ArrowTrendingUpIcon className="h-5 w-5" />
                </div>
                <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">Ver Relatórios</span>
              </Link>
              
              <Link href="/alocacao-mobile" className="group flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-all duration-200 hover:shadow hover:border-indigo-200 dark:hover:border-indigo-900">
                <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/40 transition-colors">
                  <UserCircleIcon className="h-5 w-5" />
                </div>
                <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">Alocação Mobile</span>
              </Link>
              
              <Link href="/almoxarifado/nts" className="group flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-all duration-200 hover:shadow hover:border-rose-200 dark:hover:border-rose-900">
                <div className="p-3 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 group-hover:bg-rose-200 dark:group-hover:bg-rose-800/40 transition-colors">
                  <BuildingStorefrontIcon className="h-5 w-5" />
                </div>
                <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">Notas Técnicas</span>
              </Link>
            </div>
          </div>

          {/* Atividade Recente */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna de atividades recentes */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Atividade Recente
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700 overflow-hidden">
                {recentActivities.map((activity, index) => (
                  <Link 
                    key={index} 
                    href={activity.path}
                    className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                  >
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-3">
                        {index === 0 && <ClipboardDocumentCheckIcon className="h-4 w-4" />}
                        {index === 1 && <BeakerIcon className="h-4 w-4" />}
                        {index === 2 && <TruckIcon className="h-4 w-4" />}
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{activity.description}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-xs font-medium mr-2">
                        {activity.count}
                      </span>
                      <ChevronRightIcon className="h-4 w-4 text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                    </div>
                  </Link>
                ))}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
                  <Link 
                    href="/debug"
                    className="flex items-center justify-center py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                  >
                    Ver todas as atividades
                    <ChevronRightIcon className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Coluna de informações do sistema */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Informações do Sistema
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-start">
                    <div className="mt-1 p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Versão</p>
                      <p className="text-base text-gray-900 dark:text-white">1.0.0</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="mt-1 p-1.5 rounded-md bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Última atualização</p>
                      <p className="text-base text-gray-900 dark:text-white">20 de abril de 2025</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="mt-1 p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Usuário</p>
                      <p className="text-base text-gray-900 dark:text-white truncate">{user?.email || "Não identificado"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="mt-1 p-1.5 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</p>
                      <div className="flex items-center">
                        <span className="flex h-2.5 w-2.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                        </span>
                        <p className="ml-2 text-base text-gray-900 dark:text-white">Online</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 grid grid-cols-1 gap-3">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors"
                  >
                    <ArrowLeftOnRectangleIcon className="h-4 w-4 mr-2" />
                    Sair do Sistema
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}