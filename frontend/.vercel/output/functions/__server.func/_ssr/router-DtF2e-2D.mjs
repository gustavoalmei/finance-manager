import { o as __toESM } from "../_runtime.mjs";
import { a as require_react, i as require_jsx_runtime } from "../_libs/@base-ui/react+[...].mjs";
import { P as redirect, f as createRouter, g as createRootRouteWithContext, h as createFileRoute, l as Scripts, m as lazyRouteComponent, u as HeadContent } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as getRequestHeader } from "./ssr.mjs";
import { n as zt, t as Fe } from "../_libs/react-hot-toast.mjs";
import { n as axios, t as isAxiosError } from "../_libs/axios+[...].mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { t as setupRouterSsrQueryIntegration } from "../_libs/@tanstack/react-router-ssr-query+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-DtF2e-2D.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var ThemeProviderContext = (0, import_react.createContext)({
	theme: "system",
	setTheme: () => null
});
function ThemeProvider({ children, defaultTheme = "system", storageKey = "finance-manager-theme" }) {
	const [theme, setTheme] = (0, import_react.useState)(() => {
		if (typeof window === "undefined") return defaultTheme;
		return localStorage.getItem(storageKey) ?? defaultTheme;
	});
	(0, import_react.useEffect)(() => {
		const root = window.document.documentElement;
		root.classList.remove("light", "dark");
		if (theme === "system") {
			const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
			root.classList.add(systemTheme);
			return;
		}
		root.classList.add(theme);
	}, [theme]);
	const value = {
		theme,
		setTheme: (newTheme) => {
			localStorage.setItem(storageKey, newTheme);
			setTheme(newTheme);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeProviderContext.Provider, {
		value,
		children
	});
}
var useTheme = () => (0, import_react.useContext)(ThemeProviderContext);
var STATUS_MESSAGES = {
	400: "Requisição inválida.",
	401: "Sessão expirada. Faça login novamente.",
	403: "Você não tem permissão para realizar essa ação.",
	404: "Recurso não encontrado.",
	409: "Conflito ao processar a requisição.",
	422: "Dados inválidos. Verifique os campos informados.",
	429: "Muitas requisições. Tente novamente em instantes.",
	500: "Erro interno do servidor. Tente novamente mais tarde.",
	503: "Serviço indisponível no momento."
};
var DEFAULT_MESSAGE = "Ocorreu um erro inesperado. Tente novamente.";
var NETWORK_ERROR_MESSAGE = "Não foi possível conectar ao servidor. Verifique sua conexão.";
var parseError = (error) => {
	if (isAxiosError(error)) {
		if (!error.response) return {
			message: NETWORK_ERROR_MESSAGE,
			code: error.code
		};
		const { status, data } = error.response;
		return {
			message: data?.message ?? STATUS_MESSAGES[status] ?? DEFAULT_MESSAGE,
			status,
			code: error.code
		};
	}
	if (error instanceof Error) return { message: error.message || DEFAULT_MESSAGE };
	return { message: DEFAULT_MESSAGE };
};
var getErrorMessage = (error) => parseError(error).message;
/**
* Config visual do toaster (posição, duração, cores). Usada pelo
* `<Toaster />` em `@/components/ui/toaster` — mude aqui, não lá.
* As cores usam os tokens do shadcn, então já seguem o tema claro/escuro.
*/
var toasterConfig = {
	position: "top-right",
	gutter: 8,
	toastOptions: {
		duration: 4e3,
		style: {
			background: "var(--popover)",
			color: "var(--popover-foreground)",
			border: "1px solid var(--border)",
			boxShadow: "var(--shadow-md, 0 4px 12px rgb(0 0 0 / 0.08))",
			padding: "0.75rem 1rem",
			fontSize: "0.875rem"
		},
		success: { iconTheme: {
			primary: "var(--chart-2, #22c55e)",
			secondary: "var(--popover)"
		} },
		error: { iconTheme: {
			primary: "var(--destructive)",
			secondary: "var(--popover)"
		} }
	}
};
/** Serviço padrão de notificações. Evita importar `react-hot-toast` direto nas telas. */
var ToastService = class {
	success(message, options) {
		return zt.success(message, options);
	}
	/** Aceita a mensagem pronta ou o erro cru (AxiosError, Error, etc). */
	error(error, options) {
		const message = typeof error === "string" ? error : getErrorMessage(error);
		return zt.error(message, options);
	}
	warning(message, options) {
		return zt(message, {
			icon: "⚠️",
			...options
		});
	}
	info(message, options) {
		return zt(message, {
			icon: "ℹ️",
			...options
		});
	}
	loading(message, options) {
		return zt.loading(message, options);
	}
	/** Alterna loading -> success/error automaticamente. Ideal para chamadas de API. */
	promise(promise, messages) {
		return zt.promise(promise, {
			loading: messages.loading,
			success: messages.success,
			error: messages.error ?? ((error) => getErrorMessage(error))
		});
	}
	dismiss(id) {
		zt.dismiss(id);
	}
};
var toaster = new ToastService();
/**
* Monta o toaster da aplicação. Deve ficar uma única vez no layout raiz
* (`__root.tsx`). A config (posição, cores, duração) vive em `@/lib/toaster`.
*
* Para disparar toasts a partir de qualquer componente, use o serviço
* `toaster` de `@/lib/toaster` — não importe `react-hot-toast` direto.
*/
var Toaster$1 = (props) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fe, {
		...toasterConfig,
		...props
	});
};
var styles_default = "/assets/styles-C4DmHNMR.css";
var Route$4 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{
				title: "Finance App",
				description: "Finance App",
				keywords: "finance, app"
			}
		],
		links: [{
			rel: "stylesheet",
			href: styles_default
		}, {
			rel: "icon",
			href: "../../public/favicon.ico"
		}]
	}),
	shellComponent: RootDocument
});
var noFlashThemeScript = `
(function () {
  try {
    var stored = localStorage.getItem('finance-manager-theme');
    var theme = stored === 'light' || stored === 'dark' ? stored : 'system';
    var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.add(isDark ? 'dark' : 'light');
  } catch (e) {}
})();
`;
function RootDocument({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("head", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("script", { dangerouslySetInnerHTML: { __html: noFlashThemeScript } }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ThemeProvider, { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, {})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
var getBaseURL = () => process.env.API_URL;
var getForwardedCookie = () => getRequestHeader("cookie");
var api = axios.create({ withCredentials: true });
api.interceptors.request.use((config) => {
	config.baseURL = getBaseURL();
	const cookie = getForwardedCookie();
	if (cookie) config.headers.set("cookie", cookie);
	return config;
});
var auth = {
	checkSession: async () => {
		const { data } = await api.get("/me");
		return data;
	},
	login: async (formData) => {
		const { data } = await api.post("/auth/login", formData);
		return data;
	},
	logout: async () => {
		const { data } = await api.post("/auth/logout");
		return data;
	},
	register: async (formData) => {
		const { data } = await api.post("/auth/register", formData);
		return data;
	}
};
var $$splitComponentImporter$3 = () => import("./route-DAXPpgou.mjs");
var Route$3 = createFileRoute("/_authenticated")({
	beforeLoad: async ({ context }) => {
		const user = await context.queryClient.query({
			queryKey: ["user"],
			queryFn: () => auth.checkSession()
		}).catch(() => null);
		if (!user) throw redirect({ to: "/login" });
		return { user };
	},
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./login-C3uJqtQW.mjs");
var Route$2 = createFileRoute("/login")({
	component: lazyRouteComponent($$splitComponentImporter$2, "component"),
	ssr: false,
	beforeLoad: async ({ context }) => {
		if (await context.queryClient.query({
			queryKey: ["user"],
			queryFn: () => auth.checkSession()
		}).catch(() => null)) throw redirect({ to: "/" });
	}
});
var $$splitComponentImporter$1 = () => import("./register-D8U6ZGQz.mjs");
var Route$1 = createFileRoute("/register")({
	component: lazyRouteComponent($$splitComponentImporter$1, "component"),
	ssr: false,
	beforeLoad: async ({ context }) => {
		if (await context.queryClient.query({
			queryKey: ["user"],
			queryFn: () => auth.checkSession()
		}).catch(() => null)) throw redirect({ to: "/" });
	}
});
var $$splitComponentImporter = () => import("../_authenticated-DcG00vBm.mjs");
var Route = createFileRoute("/_authenticated/")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var AuthenticatedRouteRoute = Route$3.update({
	id: "/_authenticated",
	getParentRoute: () => Route$4
});
var LoginRoute = Route$2.update({
	id: "/login",
	path: "/login",
	getParentRoute: () => Route$4
});
var RegisterRoute = Route$1.update({
	id: "/register",
	path: "/register",
	getParentRoute: () => Route$4
});
var AuthenticatedRouteRouteChildren = { AuthenticatedIndexRoute: Route.update({
	id: "/",
	path: "/",
	getParentRoute: () => AuthenticatedRouteRoute
}) };
var rootRouteChildren = {
	AuthenticatedRouteRoute: AuthenticatedRouteRoute._addFileChildren(AuthenticatedRouteRouteChildren),
	LoginRoute,
	RegisterRoute
};
var routeTree = Route$4._addFileChildren(rootRouteChildren)._addFileTypes();
function getContext() {
	return { queryClient: new QueryClient() };
}
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	const context = getContext();
	const router = createRouter({
		routeTree,
		context,
		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,
		defaultNotFoundComponent: () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "Not Found" })
	});
	setupRouterSsrQueryIntegration({
		router,
		queryClient: context.queryClient
	});
	return router;
}
//#endregion
export { useTheme as a, toaster as i, Route as n, auth as r, router_exports as t };
