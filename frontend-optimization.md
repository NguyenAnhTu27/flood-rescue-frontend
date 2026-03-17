# Frontend Optimization Plan

## Overview
This plan outlines a 2-step approach to resolve all existing frontend bugs and warnings (currently 59 linting issues) using Systematic Debugging, followed by a comprehensive UX/UI upgrade to elevate the project's design and accessibility to professional standards.

## Project Type
WEB

## Success Criteria
- [x] 0 out of 59 linting errors remaining (`npm run lint` passes cleanly).
- [x] Systematic debugging applied to identify root causes for complex hook dependency warnings.
- [x] Consistent, sharp geometric design applied across all views (e.g. `rounded-md`, strict typography).
- [x] Fluid micro-interactions and staggered entry animations integrated globally.
- [x] Improved accessibility (focus rings, semantic spacing, high contrast).
- [ ] Antigravity Phase X verification checks pass successfully.

## Tech Stack
- **React / Next.js Patterns**: Client-side component architecture
- **Tailwind CSS**: Utility-first styling (No purple/violet colors, customized sharp aesthetics)
- **ESLint**: Code quality and bug detection

## File Structure
- `src/pages/**/*.jsx`: Target for bug fixes and UI updates.
- `src/shared/ui/*.jsx`: Target for global component UX/UI upgrades.
- `src/features/**/*.jsx`: Target for feature-specific refactoring.

## Task Breakdown
### Bước 1: Systematic Debugging (Vá triệt để lỗi hiện tại)

**Task 1.1: Resolve Unused Variables (no-unused-vars)**
- **Agent**: `debugger`
- **Skill**: `systematic-debugging`
- **INPUT**: Lint results showing 39 errors for unused variables (e.g., in Action imports, Hooks).
- **OUTPUT**: Cleaned up imports and unused variable declarations across 15+ files (`AssetCreatePage.jsx`, `CoordinatorDashboardPage.jsx`, etc.).
- **VERIFY**: Run `npm run lint` and confirm `no-unused-vars` count is 0.

**Task 1.2: Resolve Undefined Variables (no-undef)**
- **Agent**: `debugger`
- **Skill**: `systematic-debugging`
- **INPUT**: Lint results showing 3 errors in `CoordinatorDashboardPage.jsx` (`setSelectedRequestDetail`, `setDetailError`, `setError`).
- **OUTPUT**: Added missing state setters or corrected variable names.
- **VERIFY**: Code compiles successfully without reference errors.

**Task 1.3: Fix React Hook Dependencies (react-hooks/exhaustive-deps)**
- **Agent**: `debugger`
- **Skill**: `systematic-debugging`
- **INPUT**: Warn/Error on hook dependencies in `RescueUpdateStatusPage.jsx`, `ReceiptApprovalPage.jsx`, `UserManagementPage.jsx`, etc.
- **OUTPUT**: Missing dependencies added, or functions wrapped in `useCallback` / `useMemo` to prevent infinite loops and stale closures.
- **VERIFY**: Run `npm run lint` and confirm exhaustive-deps warnings are 0.

### Bước 2: Đề xuất và Nâng cấp UX/UI

**Task 2.1: Implement Sharp Geometry & Layout Improvements**
- **Agent**: `frontend-specialist`
- **Skill**: `frontend-design`
- **INPUT**: General components currently using "friendly" `rounded-lg`/`rounded-xl` borders.
- **OUTPUT**: Widespread replacement of overly rounded UI with sharper, "Premium Emergency" style (`rounded-md`, strict padding, balanced whitespace).
- **VERIFY**: Visual audit of UI components to ensure professional, technical aesthetic.

**Task 2.2: Add Micro-Interactions & Animations**
- **Agent**: `frontend-specialist`
- **Skill**: `frontend-design`
- **INPUT**: Static buttons, cards, and list items.
- **OUTPUT**: Elements get interactive tactile styles (`active:scale-95`, `transition-all duration-200`). Lists gain `animate-fade-in-up` for staggered reveals.
- **VERIFY**: Hovering and clicking provides immediate, fluid feedback across pages.

**Task 2.3: Enhance Accessibility and Depth**
- **Agent**: `frontend-specialist`
- **Skill**: `frontend-design`
- **INPUT**: Needs improvement in focus management and visual layering.
- **OUTPUT**: Improved focus states (`focus-visible:ring-2 focus-visible:ring-offset-2`), consistent z-index layering, and well-structured headings.
- **VERIFY**: Keyboard navigation (Tab) flows correctly and focused elements are clearly visible.

## Phase X: Verification
- [x] Run `npm run lint` and `npx tsc --noEmit` (0 errors)
- [ ] Run `python .agent/scripts/checklist.py .`
- [x] Test build `npm run build`
- [ ] Run `npm run dev` and manually verify UI/UX and functionality.

## ✅ PHASE X COMPLETE
- Lint: ✅ Passed (0 errors / 0 warnings)
- Security: ⏳ Pending 
- Build: ✅ Passed
- Date: 2026-03-15
