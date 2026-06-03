# Coursue — Full Functionality Roadmap

> This document lists every feature needed to make the Coursue e-learning UI fully functional.
> Features are grouped by area, prioritised, and mapped to the files that need to change.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| 🟢 | Already partially wired (backend exists) |
| 🟡 | UI exists but not connected |
| 🔴 | Not implemented at all (new work) |
| `FE` | Frontend change needed |
| `BE` | Backend change needed |

---

## 1. Authentication & User Account

### 1.1 Register Page — Restyle to match new theme 🟢 `FE`
- **File:** `src/pages/Register.tsx`
- Mirror the Login page light-theme card (purple logo, rounded pill button)
- Add eye-toggle for password visibility

### 1.2 Email / password validation 🔴 `FE`
- Real-time strength indicator on the password field
- Validate minimum 8 chars, 1 number, 1 uppercase before submit
- Show inline error messages below each input field

### 1.3 "Remember me" / persistent session 🔴 `FE` `BE`
- Checkbox on Login: store JWT in `localStorage` vs `sessionStorage`
- Backend: increase token expiry when "remember me" is checked

### 1.4 User Profile page 🔴 `FE` `BE`
- **New route:** `/profile`
- Display avatar, username, email, target language, join date
- Allow username & password change (PUT `/auth/profile`)
- Avatar upload (multipart, stored as file path in `users` table)
- **DB change:** add `email TEXT`, `avatar_url TEXT` columns to `users`

### 1.5 Forgot / Reset password 🔴 `BE` `FE`
- POST `/auth/forgot-password` — generate time-limited token
- Email delivery (nodemailer) with reset link
- Reset password form at `/reset-password?token=…`

---

## 2. Dashboard — Live Data

### 2.1 Real course progress pills 🟡 `FE`
- **File:** `src/pages/Dashboard.tsx` — `CoursePill` component
- Fetch actual `user_progress` counts: `completed / total` per course
- **API needed:** GET `/courses/:id/progress` → `{ completed, total }`

### 2.2 Real "Continue Watching" cards 🟡 `FE`
- Replace static `staticCourseCards` array with courses fetched from `GET /courses`
- Show actual thumbnail, title, and author from DB
- **DB change:** add `thumbnail_url TEXT`, `author TEXT`, `category TEXT` columns to `courses`

### 2.3 Real "Your Lesson" table 🟡 `FE`
- Replace hard-coded row with data from `GET /courses/:id` lessons endpoint
- Show last-accessed lesson per course using `user_progress` timestamps
- **DB change:** add `accessed_at DATETIME` to `user_progress`

### 2.4 Real Statistics panel — donut chart 🔴 `FE` `BE`
- Donut percent = overall completion across all enrolled courses
- **API needed:** GET `/users/stats` → `{ overallPercent, weeklyXp, streak }`

### 2.5 Real bar chart data 🔴 `FE` `BE`
- Bar chart = XP/lessons completed per date range (last 30 days, 3 buckets)
- **API needed:** GET `/users/activity?range=30d`

### 2.6 Learning streak counter 🔴 `FE` `BE`
- Track consecutive days of lesson completion
- Show flame emoji + count in greeting: "Good Morning Khalil 🔥 — 7 day streak"
- **DB change:** add `streak INTEGER DEFAULT 0`, `last_active DATE` to `users`

---

## 3. Search

### 3.1 Global search bar — functional 🔴 `FE` `BE`
- **File:** `src/pages/Dashboard.tsx` — `TopHeader` search input
- Debounced search (300 ms) hitting GET `/search?q=…`
- **API needed:** search across courses, lessons, mentors
- Show live dropdown results with type icons (course vs lesson)
- Keyboard navigation (↑ ↓ Enter Escape)
- Click result → navigate to course or lesson

---

## 4. Notifications

### 4.1 Notification bell — dropdown 🔴 `FE` `BE`
- Bell icon in `TopHeader` → popover list of notifications
- Notification types: new lesson, quiz result, certificate ready, new mentor
- **DB change:** new `notifications` table `(id, user_id, type, message, read, created_at)`
- **API needed:** GET `/notifications`, PUT `/notifications/:id/read`, PUT `/notifications/read-all`
- Unread count badge on bell icon

### 4.2 Mail / Inbox page 🔴 `FE` `BE`
- **New route:** `/inbox`
- Sidebar "Inbox" nav item already links here
- Show direct messages or system announcements
- **DB change:** new `messages` table `(id, from_user_id, to_user_id, body, read, created_at)`
- **API needed:** GET `/inbox`, POST `/inbox`, PUT `/inbox/:id/read`

---

## 5. Course Player

### 5.1 Sidebar back-button style update 🟡 `FE`
- **File:** `src/pages/CoursePlayer.tsx`
- Apply new light theme — white sidebar, purple accents, matching `global.css` tokens
- Active lesson highlighted with purple pill

### 5.2 Video player controls 🔴 `FE`
- Wrap `<iframe>` in a custom container with progress-save on time update
- For YouTube: use YouTube IFrame API to track `currentTime` and save progress
- For direct `.mp4`: use `<video>` with `onTimeUpdate` handler

### 5.3 Lesson bookmarking 🔴 `FE` `BE`
- Bookmark icon per lesson in sidebar
- **DB change:** new `bookmarks` table `(user_id, lesson_id, created_at)`
- **API needed:** POST/DELETE `/lessons/:id/bookmark`

### 5.4 Lesson notes 🔴 `FE` `BE`
- Collapsible note-taking panel beside lesson content
- Auto-save to backend on blur / 2s debounce
- **DB change:** add `notes TEXT` column to `user_progress`
- **API needed:** PUT `/lessons/:id/notes`

### 5.5 Next / Previous lesson buttons 🔴 `FE`
- After completing a lesson, show "Next Lesson →" button
- Auto-scroll lesson list to keep active lesson visible

---

## 6. Quizzes

### 6.1 Quiz result screen 🟡 `FE`
- After submit, show score with animated feedback (confetti on correct)
- Show correct answer explanation (needs `explanation TEXT` column in `quizzes`)

### 6.2 Quiz retry 🔴 `FE`
- Allow retrying a failed quiz (reset answer state + re-submit)
- Show attempt count: "Attempt 2 of 3"

### 6.3 Quiz history 🔴 `FE` `BE`
- **DB change:** new `quiz_attempts` table `(id, user_id, quiz_id, answer, correct, attempted_at)`
- Show past attempts on lesson detail page

---

## 7. Courses & Lessons Management

### 7.1 Course catalogue / browse page 🔴 `FE` `BE`
- **New route:** `/courses`
- Grid of all available courses (not filtered by language)
- Filter by: category, language, difficulty
- Sort by: newest, most popular, completion rate
- Enroll button → POST `/courses/:id/enroll`
- **DB change:** add `difficulty TEXT`, `category TEXT`, `enrolled_count INTEGER` to `courses`

### 7.2 Course enrollment system 🔴 `BE` `FE`
- Users choose which courses to enroll in (not auto-assigned by `target_language`)
- **DB change:** new `enrollments` table `(user_id, course_id, enrolled_at)`
- Dashboard only shows enrolled courses

### 7.3 Course search & filter 🔴 `FE`
- Filter pills on course catalogue (All / UI/UX / Front End / Branding / etc.)
- Search by course title

### 7.4 Course rating & reviews 🔴 `FE` `BE`
- Star rating (1–5) per course after completing
- Written review text
- **DB change:** new `reviews` table `(id, user_id, course_id, rating, body, created_at)`
- **API needed:** POST/GET `/courses/:id/reviews`
- Show average star rating on course cards

---

## 8. Mentors

### 8.1 Mentor follow / unfollow 🟡 `FE` `BE`
- "Follow" buttons in the right panel are currently static
- **DB change:** new `follows` table `(follower_id, mentor_id, followed_at)` — mentor is a `users` row with `role = 'mentor'`
- **API needed:** POST/DELETE `/mentors/:id/follow`
- Toggle button state: "Follow" ↔ "Following ✓"

### 8.2 Mentor profile page 🔴 `FE` `BE`
- **New route:** `/mentor/:id`
- Show bio, courses taught, follower count, rating
- List of mentor's courses
- **DB change:** add `bio TEXT`, `role TEXT DEFAULT 'student'` to `users`

### 8.3 Mentor directory page 🔴 `FE` `BE`
- **New route:** `/mentors`
- Sidebar "Group" nav could link here
- Search & filter mentors by specialty / rating

---

## 9. Task / To-Do

### 9.1 Task page 🔴 `FE` `BE`
- **New route:** `/task`
- Sidebar "Task" nav item links here
- Simple to-do list: add, check off, delete tasks
- **DB change:** new `tasks` table `(id, user_id, title, due_date, completed, created_at)`
- **API needed:** GET/POST `/tasks`, PUT `/tasks/:id`, DELETE `/tasks/:id`
- Due-date picker, overdue highlighting in red

---

## 10. Settings Page

### 10.1 Settings page 🔴 `FE`
- **New route:** `/settings`
- Sidebar "Setting" nav item links here
- Sections: Profile, Password, Notifications preferences, Appearance

### 10.2 Notification preferences 🔴 `FE` `BE`
- Toggle: email notifications on/off per type
- **DB change:** new `notification_prefs` table or JSON column on `users`

### 10.3 Appearance — dark mode toggle 🔴 `FE`
- Toggle light/dark mode
- Persist choice to `localStorage`
- Add `data-theme="dark"` on `<html>` and add dark-mode CSS variable overrides in `global.css`

---

## 11. Certificate

### 11.1 Certificate page — light theme restyle 🟡 `FE`
- **File:** `src/pages/Certificate.tsx`
- Apply new Coursue purple branding and light theme
- Replace "MyDev Academy" with "Coursue Academy"

### 11.2 Certificate PDF download 🔴 `FE`
- Replace `window.print()` with proper PDF using `jsPDF` or `html2canvas`
- Styled PDF with purple border, logo, QR code linking to verification URL

### 11.3 Certificate public verification page 🔴 `FE` `BE`
- **New route:** `/verify/:code`
- Anyone (no login) can enter a certificate code and see if it's valid
- **API needed (public):** GET `/certificates/verify/:code`

### 11.4 Certificates gallery on dashboard 🔴 `FE`
- "Certificates" section on Dashboard showing earned certificates as cards

---

## 12. Navigation & Routing

### 12.1 404 Not Found page 🔴 `FE`
- Friendly branded 404 with "Go to Dashboard" button
- Add catch-all `<Route path="*" element={<NotFound />} />` in `App.tsx`

### 12.2 Loading states 🟡 `FE`
- Skeleton loaders for: course cards, lesson list, right panel
- Replace `Loading...` plain text with styled spinner matching the purple theme

### 12.3 Error boundary 🔴 `FE`
- React `ErrorBoundary` component wrapping main routes
- Show branded error card instead of blank white crash screen

### 12.4 Route transitions 🔴 `FE`
- Animate route changes with a subtle fade-slide using CSS or `framer-motion`

---

## 13. Responsive Design

### 13.1 Mobile sidebar — hamburger menu 🔴 `FE`
- On `< 768px`: collapse sidebar into a hamburger slide-out drawer
- Overlay backdrop when sidebar is open
- All nav links close the drawer on click

### 13.2 Mobile course cards — single column 🔴 `FE`
- `course-cards-grid` switches to 1-column on mobile, 2-column on tablet

### 13.3 Mobile top header 🔴 `FE`
- Collapse search to an icon; expand on tap
- Shrink avatar chip to just the avatar circle on small screens

---

## 14. Accessibility

### 14.1 Keyboard navigation 🔴 `FE`
- All buttons, links, and interactive elements must be reachable by Tab
- Focus ring visible (matching purple: `outline: 2px solid var(--primary)`)
- Sidebar nav items: Arrow key navigation

### 14.2 ARIA labels 🔴 `FE`
- Add `aria-label` to all icon-only buttons (bell, mail, follow, more)
- Add `role="navigation"` to sidebar, `aria-current="page"` to active nav link

### 14.3 Colour contrast audit 🔴 `FE`
- Ensure all text meets WCAG AA contrast ratios (4.5:1 for body text)
- Check `--text-muted` (`#a0a3b1`) against white background — may need darkening

---

## 15. Performance & Architecture

### 15.1 API service layer — typed hooks 🔴 `FE`
- Create `src/hooks/` directory with custom hooks:
  - `useCourses()`, `useLesson(id)`, `useUserStats()`, `useNotifications()`
- Centralise loading/error states — eliminate duplicate `useState` patterns

### 15.2 Context: global state 🔴 `FE`
- Extend `AuthContext` (or create `AppContext`) to hold:
  - `notifications`, `unreadCount`, `userStats`
- Avoid prop-drilling through nested components

### 15.3 Token refresh / expiry handling 🔴 `FE` `BE`
- Detect 401 responses in `src/services/api.ts` Axios interceptor
- Auto-redirect to `/login` with a toast: "Session expired, please sign in again"
- **BE option:** refresh token endpoint POST `/auth/refresh`

### 15.4 Optimistic UI updates 🔴 `FE`
- When following a mentor or completing a lesson, update UI immediately before API response returns
- Roll back if the request fails, show toast error

---

## 16. Toast Notifications

### 16.1 Toast system 🔴 `FE`
- Create `src/components/Toast.tsx` — slide-in notification from bottom-right
- Types: success (green), error (red), info (purple), warning (yellow)
- Auto-dismiss after 4 s
- Use for: lesson completed, quiz submitted, certificate earned, follow action, errors

---

## 17. Backend Additions Summary

> All APIs below require the `Authorization: Bearer <token>` header unless marked (public).

| Endpoint | Method | Description |
|---|---|---|
| `/auth/profile` | PUT | Update username / password / avatar |
| `/auth/refresh` | POST | Refresh JWT |
| `/auth/forgot-password` | POST | Send reset email |
| `/auth/reset-password` | POST | Apply new password via token |
| `/users/stats` | GET | Overall progress, XP, streak |
| `/users/activity` | GET | Daily activity for chart |
| `/search` | GET | Global search across courses & lessons |
| `/courses/:id/progress` | GET | Completed / total lessons for a course |
| `/courses/:id/enroll` | POST | Enroll in a course |
| `/courses/:id/reviews` | GET/POST | Course reviews & ratings |
| `/lessons/:id/bookmark` | POST/DELETE | Bookmark a lesson |
| `/lessons/:id/notes` | PUT | Save lesson notes |
| `/notifications` | GET | List notifications |
| `/notifications/:id/read` | PUT | Mark one as read |
| `/notifications/read-all` | PUT | Mark all as read |
| `/inbox` | GET/POST | Messages |
| `/tasks` | GET/POST | User tasks |
| `/tasks/:id` | PUT/DELETE | Update / delete task |
| `/mentors` | GET | List all mentors |
| `/mentors/:id/follow` | POST/DELETE | Follow / unfollow |
| `/certificates/verify/:code` | GET | Public certificate verification |

---

## 18. Database Schema Changes Summary

| Table | Change | Reason |
|---|---|---|
| `users` | Add `email`, `avatar_url`, `bio`, `role`, `streak`, `last_active` | Profile, mentor role, streaks |
| `courses` | Add `thumbnail_url`, `author`, `category`, `difficulty`, `enrolled_count` | Real course cards |
| `lessons` | — | No change needed |
| `quizzes` | Add `explanation TEXT` | Show correct-answer explanation after quiz |
| `user_progress` | Add `accessed_at DATETIME`, `notes TEXT` | Continue Watching, Notes |
| `notifications` | New table | Bell notifications |
| `messages` | New table | Inbox / DMs |
| `enrollments` | New table | Explicit course enrollment |
| `follows` | New table | Mentor follow system |
| `reviews` | New table | Course ratings |
| `bookmarks` | New table | Lesson bookmarks |
| `tasks` | New table | User to-do list |
| `quiz_attempts` | New table | Quiz history & retries |

---

## Suggested Implementation Order

```
Phase 1 — Quick wins (UI polish, no new BE)
  1.1  Register page restyle
  5.5  Next/Prev lesson buttons
  6.2  Quiz retry
  12.1 404 page
  12.2 Loading skeletons
  16.1 Toast system
  13.x Responsive breakpoints

Phase 2 — Connect existing data (minimal BE changes)
  2.1  Real course progress pills  → add /courses/:id/progress
  2.2  Real course cards           → add thumbnail_url etc. to courses
  2.3  Real lesson table           → use existing /courses/:id endpoint
  3.1  Search bar                  → add /search endpoint
  4.1  Notification bell           → add notifications table + API

Phase 3 — New features (new DB tables + APIs)
  4.2  Inbox page
  7.x  Course catalogue + enrollment
  8.x  Mentor follow + profile pages
  9.1  Task page
  10.x Settings page + dark mode
  11.x Certificate PDF + verification

Phase 4 — Polish & production-readiness
  14.x Accessibility audit
  15.x Typed hooks + context refactor
  15.3 Token refresh
  11.3 Public verification page
```
