import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type PropsWithChildren
} from "react";
import { ThemeContext } from "./ThemeContext";
import type { Theme } from "./ThemeContext.types";

function getInitialTheme(): Theme {

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") {
        return savedTheme;
    }

const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches 
? "dark" 
: "light";

localStorage.setItem("theme", systemTheme);
    return systemTheme;
}

export function ThemeProvider({ children }: PropsWithChildren) {
    const [theme, setTheme] = useState<Theme>(getInitialTheme);

    useEffect(() => {
        document.documentElement.classList.toggle("dark", theme === "dark");
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme((prevTheme) => {
            const newTheme = prevTheme === "light" ? "dark" : "light";
            localStorage.setItem("theme", newTheme);
            return newTheme;
        });
    }, []);

    const value = useMemo(() => ({ theme, toggleTheme }), 
    [theme, toggleTheme]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}
