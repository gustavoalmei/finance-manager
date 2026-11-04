import { o as __toESM } from "../_runtime.mjs";
import { a as require_react, i as require_jsx_runtime } from "../_libs/@base-ui/react+[...].mjs";
import { _ as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { r as auth } from "./router-DtF2e-2D.mjs";
import { n as ModeToggle, t as Button$1 } from "./mode-toggle-DN7f4spx.mjs";
import { a as CardTitle, c as Label, i as CardHeader, l as PasswordInput, n as CardContent, o as Carousel, r as CardDescription, s as Input$1, t as Card, u as Separator$1 } from "./separator-Cw3UswTQ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-C3uJqtQW.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Login = () => {
	const [formData, setFormData] = (0, import_react.useState)({
		email: "",
		password: ""
	});
	const navigate = useNavigate({ from: "/" });
	const handleChange = (event) => {
		const { name, value } = event.target;
		setFormData((prev) => ({
			...prev,
			[name]: value
		}));
	};
	const loginMutation = useMutation({ mutationFn: (data) => auth.login(data) });
	const handleSubmit = async (event) => {
		event.preventDefault();
		try {
			await loginMutation.mutateAsync(formData);
			navigate({ to: "/" });
		} catch (error) {
			console.log(error);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative w-svw h-svh bg-background grid grid-flow-col grid-cols-1 md:px-10 lg:grid-cols-[.75fr_1fr] p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute top-4 left-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModeToggle, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-full w-full flex flex-col items-center justify-center px-5 md:px-10",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "w-full h-fit border-0 bg-foreground ring-0 text-center px-0 py-10",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
						className: "gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
							className: "text-3xl",
							children: "Bem vindo"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Faça login para continuar" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("form", {
						onSubmit: handleSubmit,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid w-full items-center gap-6",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col space-y-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "email",
										children: "Email"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input$1, {
										id: "email",
										name: "email",
										placeholder: "Informe seu email",
										type: "email",
										className: "p-5",
										autoComplete: "email",
										value: formData.email,
										onChange: handleChange,
										required: true
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col space-y-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "password",
										children: "Password"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PasswordInput, {
										id: "password",
										name: "password",
										placeholder: "Informe sua senha",
										autoComplete: "current-password",
										value: formData.password,
										onChange: handleChange,
										required: true
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button$1, {
									type: "submit",
									className: "p-5 text-md font-bold cursor-pointer text-white dark:bg-white dark:text-black",
									children: "Entrar"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator$1, { className: "h-px" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button$1, {
									type: "button",
									onClick: () => navigate({ to: "/register" }),
									className: "p-5 text-md font-bold cursor-pointer border-black bg-white text-black dark:border-white dark:bg-transparent dark:text-white",
									children: "Criar conta"
								})
							]
						})
					}) })]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-2xl overflow-hidden not-lg:hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Carousel, {})
			})
		]
	});
};
function RouteComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Login, {});
}
//#endregion
export { RouteComponent as component };
