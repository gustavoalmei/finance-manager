import { o as __toESM } from "../_runtime.mjs";
import { a as require_react, i as require_jsx_runtime } from "../_libs/@base-ui/react+[...].mjs";
import { _ as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { i as toaster, r as auth } from "./router-DtF2e-2D.mjs";
import { n as ModeToggle, t as Button$1 } from "./mode-toggle-DN7f4spx.mjs";
import { a as CardTitle, c as Label, i as CardHeader, l as PasswordInput, n as CardContent, o as Carousel, r as CardDescription, s as Input$1, t as Card, u as Separator$1 } from "./separator-Cw3UswTQ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/register-D8U6ZGQz.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Register = () => {
	const [formData, setFormData] = (0, import_react.useState)({
		name: "",
		email: "",
		password: ""
	});
	const handleChange = (event) => {
		const { name, value } = event.target;
		setFormData((prev) => ({
			...prev,
			[name]: value
		}));
	};
	const navigate = useNavigate({ from: "/" });
	const registerMutation = useMutation({
		mutationFn: (data) => auth.register(data),
		onSuccess: () => {
			toaster.success("Conta criada com sucesso!");
			navigate({ to: "/login" });
		},
		onError: (error) => {
			toaster.error(error);
		}
	});
	const handleSubmit = (event) => {
		event.preventDefault();
		registerMutation.mutate(formData);
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
					className: "w-full h-fit border-0 bg-transparent ring-0 text-center px-0 py-10",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
						className: "gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
							className: "text-3xl",
							children: "Cadastre-se"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Crie uma conta para continuar" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("form", {
						onSubmit: handleSubmit,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid w-full items-center gap-6",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col space-y-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "name",
										children: "Nome"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input$1, {
										id: "name",
										name: "name",
										placeholder: "Informe seu nome",
										type: "text",
										className: "p-5",
										autoComplete: "name",
										value: formData.name,
										onChange: handleChange,
										required: true
									})]
								}),
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
										autoComplete: "new-password",
										value: formData.password,
										onChange: handleChange,
										required: true
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button$1, {
									type: "submit",
									className: "p-5 text-md font-bold cursor-pointer text-white dark:bg-white dark:text-black",
									children: "Criar Conta"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator$1, { className: "h-px" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button$1, {
									type: "button",
									onClick: () => navigate({ to: "/login" }),
									className: "p-5 text-md font-bold cursor-pointer border-black bg-white text-black dark:border-white dark:bg-transparent dark:text-white",
									children: "Já tenho uma conta"
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Register, {});
}
//#endregion
export { RouteComponent as component };
