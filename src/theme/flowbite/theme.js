// Tema personalizado para componentes do Flowbite
// Este arquivo ajusta o contraste e visibilidade de componentes do Flowbite em ambos os temas (claro e escuro)

export const flowbiteTheme = {
  button: {
    color: {
      primary: "bg-primary-500 hover:bg-primary-600 text-white dark:text-white focus:ring-primary-300",
      success: "bg-green-500 hover:bg-green-600 text-white dark:text-white focus:ring-green-300",
      failure: "bg-red-500 hover:bg-red-600 text-white dark:text-white focus:ring-red-300",
      warning: "bg-yellow-500 hover:bg-yellow-600 text-black dark:text-white focus:ring-yellow-300",
      info: "bg-blue-500 hover:bg-blue-600 text-white dark:text-white focus:ring-blue-300",
      light: "bg-gray-200 hover:bg-gray-300 text-gray-900 dark:text-white focus:ring-gray-100",
      dark: "bg-gray-800 hover:bg-gray-900 text-white dark:text-white focus:ring-gray-300",
      gray: "bg-gray-100 hover:bg-gray-200 text-gray-800 dark:text-white focus:ring-gray-50",
    },
  },
  modal: {
    header: {
      base: "flex items-start justify-between rounded-t p-5 theme-border-light theme-text-primary",
    },
    body: {
      base: "p-6 flex-1 overflow-auto theme-text-primary",
    },
    footer: {
      base: "flex items-center space-x-2 rounded-b p-6 theme-border-light",
    },
  },
  badge: {
    root: {
      color: {
        info: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
        gray: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
        failure: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
        success: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
        warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
        indigo: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300",
        purple: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
        pink: "bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300",
      },
    },
  },
  label: {
    root: {
      colors: {
        default: "text-gray-900 dark:text-white",
      },
    },
  },
  textInput: {
    field: {
      input: {
        colors: {
          gray: "bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500",
        },
      },
    },
  },
  spinner: {
    color: {
      success: "fill-green-500",
      gray: "fill-gray-600 dark:fill-gray-300",
      failure: "fill-red-600",
      info: "fill-blue-600",
      pink: "fill-pink-600",
      purple: "fill-purple-600",
      warning: "fill-yellow-400",
    },
  },
  card: {
    root: {
      base: "flex rounded-lg border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800 flex-col",
    },
  },
};