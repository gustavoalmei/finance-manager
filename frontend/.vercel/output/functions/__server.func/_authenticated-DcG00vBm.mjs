import { i as require_jsx_runtime, r as Button } from "./_libs/@base-ui/react+[...].mjs";
import { _ as useNavigate } from "./_libs/@tanstack/react-router+[...].mjs";
import { t as useMutation } from "./_libs/tanstack__react-query.mjs";
import { n as Route, r as auth } from "./_ssr/router-DtF2e-2D.mjs";
import { n as ModeToggle } from "./_ssr/mode-toggle-DN7f4spx.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_authenticated-DcG00vBm.js
var import_jsx_runtime = require_jsx_runtime();
function Home() {
	const { user } = Route.useRouteContext();
	const logoutMutation = useMutation({ mutationFn: () => auth.logout() });
	const navigate = useNavigate({ from: "/" });
	const loggout = () => {
		logoutMutation.mutate();
		navigate({ to: "/login" });
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "w-svw h-svh bg-background dark:text-white text-black",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModeToggle, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-4xl font-bold",
				children: "Welcome to TanStack Start"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-4 text-lg",
				children: ["Logado como ", user.name]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-4 text-lg",
				children: [
					"Edit ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "src/routes/_authenticated/index.tsx" }),
					" to get started."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "border border-black rounded-2xl px-2 bg-blue-300 text-white",
				onClick: () => loggout(),
				children: "Deslogar"
			})
		]
	});
}
//#endregion
export { Home as component };
