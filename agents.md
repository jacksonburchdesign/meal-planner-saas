# MealHouse AI Agent Instructions

Welcome! If you are an AI assistant (Google Gemini, Claude, Antigravity, etc.) reading this file, you are working on **MealHouse**, a multi-tenant SaaS meal planning platform. 

This document outlines the strict architectural rules, design conventions, and security patterns you MUST follow to ensure the application remains stable, secure, and cost-effective.

## 1. Tech Stack
*   **Frontend:** React (Vite), TypeScript, Tailwind CSS, Framer Motion.
*   **Backend / Database:** Firebase (Firestore, Cloud Functions, Authentication).
*   **Payments:** Stripe.

## 2. Multi-Tenant Architecture & Security
MealHouse is a multi-tenant application where users belong to a specific "Family".
*   **The Tenant Boundary:** EVERY database query, mutation, and security rule MUST be rigidly scoped to the active `familyId`. 
*   **Never Cross Tenants:** Never write a query that fetches data globally across collections without a `where('familyId', '==', familyId)` clause.
*   **Firestore Rules:** All new collections must have strict security rules enforcing `familyId` ownership. For social features (e.g., `familyConnections`, `sharedRecipes`), ensure both the sending and receiving `familyId` logic is tightly secured.

## 3. Data Fetching & State Management (CRITICAL)
*   **Use `TenantDataContext`:** Do NOT write one-off `onSnapshot` listeners in individual components or hooks. All core tenant data (Recipes, Weekly Meals, Settings, Notifications, Connections) is fetched globally via `TenantDataContext.tsx` to minimize Firebase read costs. 
*   **Hook Consumption:** Always use `useTenantData()` to consume this data. If you need a new global data stream, add it to `TenantDataContext` rather than isolating it.

## 4. React Compiler & Purity Rules
*   **No Impure Renders:** Never call impure functions (e.g., `Math.random()`, `Date.now()`, `uuid()`) directly in the render body or inside `useMemo`. 
*   **State Initialization:** If you need random or initial values that shouldn't change across renders, initialize them inside a `useState(() => ...)` callback or handle them in a `useEffect`.
*   **Dependency Arrays:** Ensure all `useCallback` and `useEffect` dependency arrays are exhaustive and accurate to prevent infinite loops and stale closures.

## 5. Type Safety
*   **No `any` Types:** Do not use `any`. Write strict TypeScript interfaces for all data models, Firebase payloads, and component props. 
*   **Cloud Functions:** When writing or modifying Firebase Cloud Functions, ensure all request data and Stripe webhook events are strictly typed before processing.

## 6. UI/UX & Design Aesthetics
*   **Premium Feel:** MealHouse is designed to feel premium, modern, and highly polished. 
*   **Dynamic Theming:** The app supports dynamic themes based on family settings. Always use the CSS variable `--tenant-color-primary` (e.g., `bg-primary-500`, `text-primary-600`) instead of hardcoding specific Tailwind colors (like `bg-blue-500`).
*   **Animations:** Use `framer-motion` for smooth page transitions, list reordering, and micro-interactions. Include hover states, subtle glows, and scale effects on interactive elements.

## 7. Performance & SEO
*   **Memoization:** Memoize expensive calculations (like generating shopping lists from ingredients) using `useMemo` or `useCallback`.
*   **SEO Meta Tags:** When building public-facing pages (Storefront), ensure Open Graph, Twitter Cards, and JSON-LD schema data are properly implemented and maintained.

By strictly adhering to these rules, you will help maintain a fast, scalable, and secure application.
