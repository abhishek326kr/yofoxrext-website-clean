# YoForex Platform - Comprehensive Testing Plan (200+ Steps)

## TEST EXECUTION DATE: 2025-10-28
## TESTER: QA Agent
## OBJECTIVE: Thoroughly test all frontend, backend, logic, algorithms, calculations, and user flows

---

## CATEGORY 1: HOMEPAGE & NAVIGATION (20 steps)

### Homepage Tests
1. **Homepage Load** - Verify homepage loads at http://localhost:5000
2. **Stats Bar** - Check totalThreads, totalMembers, totalPosts display correctly
3. **Stats Bar Refresh** - Click refresh button, verify stats update
4. **Category Tree** - Verify top 6 categories display with correct data
5. **Week Highlights** - Check "New", "Trending", "Solved" tabs work
6. **Week Highlights Refresh** - Test manual refresh button
7. **What's Hot** - Verify hot content displays with engagement scores
8. **What's Hot Refresh** - Test manual refresh functionality
9. **Top Sellers** - Verify top sellers section displays correctly
10. **Top Sellers Refresh** - Test refresh button
11. **Important Links** - Verify all 15 guide links are clickable
12. **Header Navigation** - Test Categories, Discussions, Brokers, Members links
13. **Search Bar** - Test search input accepts text
14. **Theme Toggle** - Switch between light/dark mode
15. **Mobile Menu** - Test mobile hamburger menu opens/closes
16. **Logo Click** - Click YoForex logo, verify returns to homepage
17. **Footer Links** - Test all footer links navigate correctly
18. **Auth State** - Verify login/logout button displays based on auth state
19. **Responsive Design** - Check homepage on mobile viewport (375px)
20. **Load Time** - Verify page loads in under 3 seconds

---

## CATEGORY 2: AUTHENTICATION & AUTHORIZATION (25 steps)

### Authentication Flow
21. **Login Button** - Click login, verify Replit Auth modal appears
22. **Login Success** - After login, verify user profile appears in header
23. **User Avatar** - Check user avatar displays or initials fallback
24. **User Dropdown** - Click avatar, verify dropdown menu appears
25. **Dashboard Link** - From dropdown, navigate to /dashboard
26. **Settings Link** - From dropdown, navigate to /settings
27. **Logout** - Click logout, verify redirects to homepage
28. **Session Persistence** - Refresh page, verify session persists
29. **Protected Routes** - Try accessing /dashboard without auth (should redirect)
30. **API Auth** - Call /api/me without auth, verify 401 response
31. **Coin Balance** - After login, verify coin balance displays
32. **Coin USD Conversion** - Check coin-to-USD conversion displays correctly
33. **Notification Badge** - Verify unread notification count appears
34. **Messages Icon** - Check messages icon appears when authenticated
35. **New Thread Button** - On category pages, verify "New Thread" button shows only when authenticated
36. **Profile Completion** - Check onboarding progress displays
37. **First Login** - Verify onboarding dialog appears for new users
38. **Email Verification** - Check email field populates from Replit Auth
39. **Profile Image** - Verify profileImageUrl from Replit Auth displays
40. **Username Display** - Check username or firstName+lastName displays
41. **Role Check** - Verify admin users see admin dashboard link
42. **Multi-tab Auth** - Login in one tab, verify auth syncs to other tabs
43. **Session Expiry** - Wait for session expiry, verify auto-logout
44. **CSRF Protection** - Verify CSRF tokens on forms
45. **XSS Protection** - Test XSS payloads in inputs, verify sanitization

---

## CATEGORY 3: CATEGORY PAGES & ROUTING (30 steps)

### Category Navigation
46. **Categories Page** - Navigate to /categories, verify all 59 categories display
47. **Category Grid** - Check categories display in hierarchical grid
48. **Category Click** - Click any category, navigate to /category/[slug]
49. **Category Slug Routing** - Test all 59 category slugs resolve correctly
50. **Breadcrumbs** - On category page, verify breadcrumb navigation
51. **Search Within Category** - Test search bar filters threads in category
52. **Tab Filters** - Test Latest, Trending, Answered tabs
53. **Thread List** - Verify threads display with correct data
54. **Thread Sorting** - Verify threads sort by lastActivityAt (Latest tab)
55. **Trending Sort** - On Trending tab, verify sort by views + replies
56. **Answered Filter** - On Answered tab, verify only threads with accepted answers
57. **Empty State** - Navigate to empty category, verify empty state message
58. **Pagination** - Test load more or pagination if >20 threads
59. **Thread Count** - Verify thread count matches database
60. **Last Activity** - Check lastActivityAt displays correctly
61. **View Count** - Verify view count increments on thread click
62. **Reply Count** - Check reply count badge displays correctly
63. **Pinned Threads** - Verify pinned threads appear at top
64. **Locked Threads** - Check locked threads show lock icon
65. **Category Stats** - Verify total threads, posts, members stats
66. **Category Description** - Check category description displays
67. **Subcategories** - If category has children, verify subcategories show
68. **Parent Category** - From subcategory, verify link to parent
69. **Category Icons** - Check category icons display correctly
70. **Category Colors** - Verify category color coding
71. **SSR Data** - Verify category data server-side rendered
72. **404 Handling** - Navigate to /category/invalid-slug, verify 404 page
73. **ISR Revalidation** - Verify categories revalidate every 60 seconds
74. **Back Button** - Use browser back from category, verify state preserved
75. **Deep Linking** - Share category URL, verify loads correctly

---

## CATEGORY 4: THREAD CREATION & INTERACTION (35 steps)

### Thread Creation
76. **New Thread Button** - On category page, click "New Thread"
77. **Thread Composer** - Verify /discussions/new page loads
78. **Title Input** - Enter thread title, verify character count (0/90)
79. **Title Validation** - Try submitting with <10 chars, verify error
80. **Body Input** - Enter thread body, verify character count (0/500)
81. **Body Validation** - Try submitting with <500 chars, verify error
82. **Category Selection** - Select category from dropdown
83. **Subcategory** - If available, select subcategory
84. **Thread Type** - Verify 6 thread type options (question, discussion, review, journal, guide, program_sharing)
85. **Program Sharing Type** - Select "program_sharing", verify icon changes
86. **SEO Accordion** - Expand "Help others find this" accordion
87. **Primary Keyword** - Enter primary keyword, verify SEO preview updates
88. **SEO Excerpt** - Enter 120-160 char excerpt, verify counter
89. **Keyword Density** - Enter body with keyword, verify density calculation (0.5-3%)
90. **SEO Preview** - Verify Google search preview displays correctly
91. **Trading Metadata** - Select instruments (EURUSD, XAUUSD)
92. **Timeframes** - Select timeframes (M1, M5, H1)
93. **Strategies** - Select strategies from dropdown
94. **Hashtags** - Add hashtags, verify tag validation
95. **File Upload** - Test file upload (if available)
96. **Image Upload** - Upload images, verify preview
97. **Submit Thread** - Click submit, verify loading state
98. **Slug Generation** - Verify thread slug auto-generated server-side
99. **Coin Award** - After creation, verify 10-12 coins awarded
100. **Coin Transaction** - Check coin transaction created in database
101. **Notification** - Verify notification sent for thread creation
102. **Redirect** - After creation, verify redirects to thread detail page
103. **Thread Display** - Verify new thread displays with all metadata
104. **Thread Type Badge** - Check thread type badge displays correctly
105. **Edit Thread** - Click edit (as author), verify edit form pre-populates
106. **Edit Validation** - Update thread, verify validation still works
107. **Save Edit** - Save changes, verify updates persist
108. **Delete Thread** - As author, delete thread, verify soft delete
109. **Pin Thread** - As admin, pin thread, verify isPinned flag
110. **Lock Thread** - As admin, lock thread, verify isLocked flag

---

## CATEGORY 5: THREAD VIEWING & REPLIES (30 steps)

### Thread Detail Page
111. **Thread Load** - Navigate to /thread/[slug], verify thread loads
112. **Thread Title** - Verify thread title displays correctly
113. **Thread Body** - Check thread body renders with markdown
114. **Author Info** - Verify author username, avatar, badges
115. **Created Date** - Check createdAt displays in relative format
116. **View Count** - Verify view count increments on page load
117. **Reply Count** - Check total reply count displays
118. **Helpful Votes** - Verify helpful vote count on thread
119. **Vote Button** - Click "Mark Helpful", verify vote increments
120. **Vote Logic** - Try voting again, verify can't double-vote
121. **Reading Progress** - Scroll thread, verify progress bar updates
122. **Floating Action Bar** - Scroll down, verify action bar appears
123. **Reply Button** - Click reply, verify reply form appears
124. **Reply Input** - Enter reply text, verify character validation
125. **@Mentions** - Type @username, verify mention autocomplete
126. **Reply Submit** - Submit reply, verify posts successfully
127. **Reply Coin Award** - Verify 5 coins awarded for reply
128. **Nested Replies** - Reply to a reply, verify nesting
129. **Accepted Answer** - As thread author, mark reply as accepted
130. **Accepted Badge** - Verify accepted answer badge displays
131. **Accepted Coin Bonus** - Check 15 bonus coins awarded for accepted answer
132. **Reply Editing** - Edit own reply, verify updates
133. **Reply Deletion** - Delete own reply, verify removed
134. **Reply Pagination** - If >50 replies, verify pagination
135. **Sort Replies** - Test sorting by newest/oldest/helpful
136. **Code Blocks** - Post reply with code, verify syntax highlighting
137. **Links** - Post reply with URL, verify clickable link
138. **Images** - Post reply with image URL, verify image renders
139. **Emoji** - Post reply with emoji, verify displays correctly
140. **Quote** - Quote another reply, verify quote format

---

## CATEGORY 6: USER PROFILES & DASHBOARD (30 steps)

### Profile Pages
141. **Profile Navigation** - Navigate to /profile/[username]
142. **Profile Info** - Verify username, bio, location display
143. **Profile Stats** - Check total coins, reputation, rank
144. **Threads Tab** - View user's threads, verify list
145. **Replies Tab** - View user's replies, verify display
146. **Content Tab** - View published content (EAs, indicators)
147. **Badges** - Verify badges display with icons
148. **Follow Button** - Click follow, verify follows user
149. **Follower Count** - Check follower count increments
150. **Unfollow** - Click unfollow, verify unfollows
151. **Trading Stats** - View myfxbook link, YouTube, etc.
152. **Profile Edit** - Navigate to /settings, edit profile
153. **Display Name** - Update display name, verify saves
154. **Bio** - Update bio (max 500 chars), verify saves
155. **Location** - Update location, verify saves
156. **Website** - Add website URL, verify validation
157. **Social Links** - Add YouTube, Instagram, Telegram handles
158. **Avatar Upload** - Upload profile picture, verify updates
159. **Email Settings** - Toggle email notifications
160. **Privacy Settings** - Update privacy preferences
161. **Password Change** - Change password (if using local auth)
162. **Account Deletion** - Request account deletion
163. **Dashboard Load** - Navigate to /dashboard
164. **Dashboard Widgets** - Verify customizable widgets display
165. **Widget Reordering** - Drag and drop widgets, verify saves
166. **Widget Toggle** - Hide/show widgets, verify persists
167. **Recent Activity** - Check recent activity feed
168. **Coin History** - View coin transaction history
169. **Earning Stats** - View weekly/monthly coin earnings graph
170. **Activity Minutes** - Check today's active minutes display

---

## CATEGORY 7: COIN ECONOMY & CALCULATIONS (40 steps)

### Coin Earning Logic
171. **Activity Tracker Start** - Login, verify ActivityTracker component loads
172. **Activity Detection** - Move mouse, verify activity detected
173. **5-Minute Interval** - Wait 5 minutes (or simulate), verify coin award
174. **Coin Calculation** - Verify 5 minutes ÷ 10 = 0.5 coins awarded
175. **10-Minute Test** - Simulate 10 minutes, verify 1.0 coins awarded
176. **15-Minute Test** - Simulate 15 minutes, verify 1.5 coins awarded
177. **Daily Cap** - Simulate 500 minutes, verify caps at 50 coins
178. **Over-Cap Test** - Try 600 minutes, verify still caps at 50 coins
179. **Activity Notification** - Verify notification appears when coins awarded
180. **Toast Notification** - Check toast: "You earned 0.5 coins for being active!"
181. **Coin Balance Update** - Verify coin balance updates in header
182. **Transaction Creation** - Check coin transaction created with type="earn"
183. **Session Tracking** - Verify lastActivityPing stored in session
184. **First Ping** - First activity ping should NOT award coins (initializing)
185. **Second Ping** - Second ping after 5 min should award coins
186. **Time Calculation** - Verify elapsed = (now - lastPing) / 60000 minutes
187. **5-Min Cap** - Simulate 10-min gap, verify capped at 5 minutes max
188. **1-Min Minimum** - Try pinging after 30 seconds, verify no award (1 min minimum)
189. **Rate Limiting** - Send 2 requests within 1 minute, verify 429 error
190. **Anonymous Activity** - Try activity tracking without auth, verify 401
191. **Multiple Tabs** - Open 2 tabs, verify activity tracked separately per session
192. **Daily Limit Reset** - Next day, verify daily limit resets to 0
193. **Thread Creation Coins** - Create thread, verify 10-12 coins awarded
194. **Reply Coins** - Post reply, verify 5 coins awarded
195. **Accepted Answer Coins** - Get answer accepted, verify 15 bonus coins
196. **Purchase Deduction** - Buy content, verify coins deducted correctly
197. **Withdrawal Fee** - Request withdrawal, verify 5% fee calculated correctly
198. **Minimum Withdrawal** - Try withdrawing <1000 coins, verify error
199. **Coin-to-USD** - Verify 100 coins = $5.50 USD conversion
200. **Recharge Calculation** - Test coin packages: 100, 500, 1000, 5000 coins
201. **Daily Check-in** - Check in daily, verify streak counter
202. **Streak Bonus** - 7-day streak, verify 50 bonus coins
203. **Referral Coins** - Refer user, verify 100 coins after they create thread
204. **Profile Completion** - Upload avatar, verify 10 coins awarded
205. **First Thread** - Create first thread, verify 10 coins (onboarding)
206. **First Publish** - Publish first EA, verify 30 coins
207. **50 Followers** - Get 50 followers, verify 200 coins
208. **YouTube Reward** - Link YouTube with 500+ subs, verify 500 coins
209. **Myfxbook Reward** - Link verified myfxbook, verify 1000 coins
210. **Negative Balance** - Try spending more than balance, verify error

---

## CATEGORY 8: RANKING ALGORITHM & REPUTATION (25 steps)

### Ranking Calculations
211. **Engagement Score** - Create thread with 10 replies, verify engagement calculation
212. **View Weight** - Check views × 0.1 in engagement score
213. **Reply Weight** - Check replies × 1 in engagement score
214. **Helpful Weight** - Check helpfulVotes × 2 in engagement score
215. **Time Decay** - Verify older threads have lower scores
216. **Decay Formula** - Check 1 / (1 + daysSinceCreation / 30)
217. **Hot Content** - Verify "What's Hot" uses engagement score
218. **Trending Threads** - Check trending calculation uses time decay
219. **User Reputation** - Check totalThreads + totalReplies × 0.5 + helpfulVotes × 2
220. **Top Contributors** - Verify leaderboard sorts by reputation
221. **Sales Score** - For marketplace, verify totalSales × priceCoins × 0.1
222. **Top Sellers** - Check top sellers ranked by sales score
223. **Weekly Streaks** - Verify daily check-in streak tracking
224. **Streak Leaderboard** - Check weekly streaks leaderboard
225. **Rank Assignment** - Verify user rank calculated from reputation
226. **Rank Update** - Change reputation, verify rank recalculates
227. **Rank Percentile** - Check rank shows percentile (top 10%, etc.)
228. **Badge Awards** - Reach 100 threads, verify "Top Contributor" badge
229. **EA Expert Badge** - Publish 10 EAs, verify badge awarded
230. **Helpful Member** - Get 50 helpful votes, verify badge
231. **Early Adopter** - Check early users have badge
232. **Verified Trader** - Link myfxbook, verify "Verified Trader" badge
233. **Badge Display** - Verify badges show on profile and posts
234. **Leveling System** - Reach level 5, verify level up notification
235. **Level Calculation** - Check level = floor(totalCoins / 1000)

---

## CATEGORY 9: MARKETPLACE & CONTENT (25 steps)

### Marketplace Functionality
236. **Marketplace Page** - Navigate to /marketplace
237. **Content Grid** - Verify EAs, indicators, articles display
238. **Filter by Type** - Filter by EA, verify only EAs show
239. **Filter by Platform** - Filter MT4, verify MT4 content
240. **Price Range** - Filter by price range (0-100 coins)
241. **Search** - Search content by keyword
242. **Sort Options** - Sort by newest, popular, price
243. **Content Card** - Click content, navigate to detail page
244. **Content Detail** - Verify title, description, images display
245. **Price Display** - Check price in coins and USD
246. **Author Info** - Verify author profile link
247. **Purchase Button** - Click purchase, verify modal appears
248. **Coin Balance Check** - Verify checks sufficient balance
249. **Purchase Confirmation** - Confirm purchase, verify deducts coins
250. **Download Link** - After purchase, verify download link appears
251. **Purchase History** - Check /purchases shows purchased items
252. **Review Form** - Submit review with 1-5 stars
253. **Review Display** - Verify review appears on content page
254. **Average Rating** - Check average rating calculation
255. **Review Count** - Verify review count increments
256. **Like Button** - Like content, verify like count
257. **Q&A Section** - Post question on content
258. **Q&A Reply** - Author replies to question
259. **File Download** - Download EA file, verify file integrity
260. **Publish Content** - Navigate to /publish, create new EA

---

## CATEGORY 10: BROKER REVIEWS & DIRECTORY (20 steps)

### Broker Features
261. **Brokers Page** - Navigate to /brokers
262. **Broker List** - Verify brokers display with ratings
263. **Broker Search** - Use search autocomplete, verify suggests brokers
264. **Search Debouncing** - Type quickly, verify debounces at 300ms
265. **Broker Filter** - Filter by regulation (FCA, ASIC)
266. **Platform Filter** - Filter by MT4/MT5
267. **Spread Filter** - Filter by spread type (fixed, variable)
268. **Broker Card** - Click broker, navigate to detail page
269. **Broker Logo** - Verify logo displays (Clearbit or fallback)
270. **Logo Fallback** - For broker without logo, verify fallback icon
271. **Broker Info** - Check company info, regulation, year founded
272. **Review Form** - Submit broker review
273. **Rating Input** - Select 1-5 stars rating
274. **Review Text** - Enter review text (min 100 chars)
275. **Review Submit** - Submit, verify saves and displays
276. **Auto Rating** - Verify broker auto-rating from all reviews
277. **Scam Report** - Report broker as scam
278. **Scam Count** - Check scam report count increments
279. **Verified Badge** - Verify verified brokers show badge
280. **Broker Stats** - Check total reviews, average rating

---

## CATEGORY 11: NOTIFICATIONS & MESSAGES (20 steps)

### Notification System
281. **Notification Center** - Navigate to /notifications
282. **Notification List** - Verify notifications display
283. **Unread Count** - Check unread badge in header
284. **Notification Types** - Verify types: coin_earned, reply, mention, follow
285. **Mark as Read** - Click notification, verify marks as read
286. **Mark All Read** - Click "Mark all read", verify all marked
287. **Notification Click** - Click notification, verify navigates to target
288. **Real-time Update** - Receive new notification, verify appears without refresh
289. **Notification Deletion** - Delete notification, verify removed
290. **Notification Settings** - Toggle notification preferences
291. **Message Center** - Navigate to /messages
292. **Conversation List** - Verify conversations display
293. **New Message** - Start new conversation
294. **Send Message** - Send message, verify delivers
295. **Receive Message** - Receive message, verify appears
296. **Unread Messages** - Check unread message count
297. **Message Read** - Open message, verify marks as read
298. **Message Search** - Search messages by keyword
299. **Conversation Delete** - Delete conversation
300. **Block User** - Block user, verify can't receive messages

---

## CATEGORY 12: ADMIN DASHBOARD (25 steps)

### Admin Features
301. **Admin Access** - As admin, navigate to /admin
302. **Non-Admin Block** - As regular user, verify /admin returns 403
303. **Admin Stats** - Check dashboard shows platform stats
304. **User Management** - View all users in admin panel
305. **Ban User** - Ban user, verify can't login
306. **Unban User** - Unban user, verify can login
307. **Moderation Queue** - View reported content
308. **Approve Content** - Approve pending content
309. **Reject Content** - Reject content with reason
310. **Delete Content** - Delete inappropriate content
311. **System Settings** - View and edit system settings
312. **Feature Flags** - Toggle feature flags
313. **Announcements** - Create platform announcement
314. **Email Templates** - View and edit email templates
315. **Support Tickets** - View support tickets
316. **Assign Ticket** - Assign ticket to admin
317. **Close Ticket** - Resolve and close ticket
318. **Financial Report** - View revenue and coin economy stats
319. **Withdrawal Approval** - Approve pending withdrawals
320. **Withdrawal Rejection** - Reject withdrawal with reason
321. **Refund Processing** - Process refund request
322. **Admin Actions Log** - View audit log of admin actions
323. **Security Events** - View security event logs
324. **IP Bans** - Add IP to ban list
325. **Performance Metrics** - View system performance graphs

---

## CATEGORY 13: GUIDES & DOCUMENTATION (15 steps)

### Guide Pages
326. **Guides List** - Verify all 15 guides accessible from homepage
327. **Forum Rules** - Navigate to /guides/forum-rules, verify loads
328. **Safe Download** - Navigate to /guides/safe-download-guide
329. **Verified Brokers** - Navigate to /guides/verified-brokers
330. **EA Coding Rules** - Navigate to /guides/ea-coding-rules
331. **Earn Coins Guide** - Navigate to /guides/how-to-earn-coins
332. **Thread Visibility** - Navigate to /guides/how-to-get-your-thread-seen
333. **Ranking Articles** - Navigate to /guides/how-to-rank-articles-blogs
334. **EA Publications** - Navigate to /guides/how-to-rank-ea-publications
335. **New Member Quickstart** - Navigate to /guides/new-member-quickstart
336. **Report Scam** - Navigate to /guides/report-a-scam
337. **Badges & Levels** - Navigate to /guides/badges-levels
338. **Seller Guide** - Navigate to /guides/marketplace-seller-guide
339. **Thread Template** - Navigate to /guides/template-beginner-thread
340. **Review Template** - Navigate to /guides/template-ea-review

---

## CATEGORY 14: FORMS & VALIDATION (20 steps)

### Input Validation
341. **Empty Form Submit** - Try submitting empty form, verify errors
342. **Title Min Length** - Enter <10 chars in title, verify error
343. **Title Max Length** - Enter >90 chars, verify truncates/errors
344. **Body Min Length** - Enter <500 chars in body, verify error
345. **Body Max Length** - Test very long body text
346. **Email Validation** - Enter invalid email, verify format error
347. **URL Validation** - Enter invalid URL, verify error
348. **Number Validation** - Enter non-number in number field, verify error
349. **Date Validation** - Enter invalid date format, verify error
350. **Password Strength** - Enter weak password, verify strength indicator
351. **Confirm Password** - Passwords don't match, verify error
352. **Required Fields** - Skip required field, verify error highlight
353. **Character Counter** - Type in textarea, verify counter updates
354. **Word Counter** - Verify character count, not word count
355. **SQL Injection** - Enter SQL payload, verify sanitization
356. **XSS Attempt** - Enter script tag, verify sanitization
357. **Special Characters** - Enter unicode, emoji, verify handles
358. **File Size** - Upload >10MB file, verify size limit error
359. **File Type** - Upload .exe file, verify type validation
360. **Multiple Files** - Upload multiple files, verify all process

---

## CATEGORY 15: SEARCH & FILTER LOGIC (15 steps)

### Search Functionality
361. **Global Search** - Use header search, verify results
362. **Search Threads** - Search for thread title, verify finds
363. **Search Users** - Search for username, verify finds
364. **Search Content** - Search marketplace, verify finds
365. **Search Brokers** - Search broker name, verify autocomplete
366. **Empty Search** - Submit empty search, verify shows all
367. **No Results** - Search gibberish, verify "no results" message
368. **Search Highlighting** - Verify search terms highlighted in results
369. **Category Filter** - Filter search by category
370. **Date Filter** - Filter by date range
371. **Tag Filter** - Filter by hashtags
372. **Sort Results** - Sort search results by relevance, date, popularity
373. **Pagination** - Search with >20 results, verify pagination
374. **Search History** - Verify recent searches saved
375. **Clear Search** - Click X, verify clears search

---

## CATEGORY 16: RESPONSIVE DESIGN & MOBILE (15 steps)

### Mobile Testing
376. **Mobile Viewport** - Set viewport to 375px, verify layout
377. **Tablet Viewport** - Set to 768px, verify responsive
378. **Desktop HD** - Test at 1920px, verify scales
379. **Touch Targets** - Check buttons are min 44px for touch
380. **Hamburger Menu** - On mobile, test hamburger menu
381. **Mobile Navigation** - Navigate pages on mobile
382. **Mobile Forms** - Fill form on mobile, verify keyboard doesn't obscure
383. **Mobile Scrolling** - Test smooth scrolling on mobile
384. **Mobile Images** - Verify images scale correctly
385. **Mobile Typography** - Check font sizes readable on mobile
386. **Orientation Change** - Rotate device, verify layout adapts
387. **Mobile Performance** - Check page load on mobile (3G simulation)
388. **Touch Gestures** - Swipe, pinch-to-zoom where appropriate
389. **Mobile Tables** - Verify tables scroll horizontally on mobile
390. **Mobile Footer** - Check footer doesn't overflow on mobile

---

## CATEGORY 17: ERROR HANDLING & EDGE CASES (20 steps)

### Error Scenarios
391. **404 Page** - Navigate to /invalid-route, verify 404 page
392. **500 Error** - Trigger server error, verify error page
393. **Network Error** - Disconnect internet, verify offline message
394. **Timeout** - Slow API response, verify timeout handling
395. **Empty State** - View empty category, verify empty message
396. **No Permissions** - Try admin action as regular user, verify 403
397. **Deleted Resource** - View deleted thread, verify 404 or message
398. **Invalid ID** - Navigate to /thread/invalid-uuid, verify error
399. **Concurrent Edits** - Two users edit same thread, verify conflict resolution
400. **Rate Limit** - Exceed rate limit, verify 429 error
401. **Invalid Token** - Use invalid auth token, verify 401
402. **Expired Session** - Use expired session, verify prompts re-login
403. **Database Error** - Simulate DB error, verify graceful handling
404. **File Upload Fail** - Upload fails, verify error message
405. **Payment Error** - Payment fails, verify error and rollback
406. **Withdrawal Error** - Withdrawal fails, verify coins restored
407. **Email Send Fail** - Email fails to send, verify logged
408. **Browser Back** - Use back button extensively, verify no crashes
409. **Rapid Clicks** - Rapidly click submit, verify prevents duplicate
410. **Long Session** - Stay logged in 24 hours, verify session handling

---

## CATEGORY 18: PERFORMANCE & LOAD (15 steps)

### Performance Testing
411. **Page Load Time** - Measure homepage load, verify <3 seconds
412. **API Response Time** - Check API endpoints respond <500ms
413. **Database Queries** - Verify queries are optimized (no N+1)
414. **Image Optimization** - Check images are compressed
415. **Lazy Loading** - Verify images lazy load
416. **Code Splitting** - Check JS bundles are split
417. **Caching** - Verify browser caching headers
418. **CDN Usage** - Check static assets served from CDN
419. **Memory Leaks** - Monitor memory usage over time
420. **CPU Usage** - Check CPU stays reasonable
421. **Bundle Size** - Measure JS bundle, verify <500KB
422. **Lighthouse Score** - Run Lighthouse, aim for >90
423. **Core Web Vitals** - Check LCP, FID, CLS metrics
424. **Concurrent Users** - Simulate 10 concurrent users
425. **Load Testing** - Test with 100 concurrent requests

---

## CATEGORY 19: SEO & META TAGS (10 steps)

### SEO Verification
426. **Page Titles** - Verify each page has unique title
427. **Meta Descriptions** - Check meta descriptions present
428. **Open Graph Tags** - Verify OG tags for social sharing
429. **Twitter Cards** - Check Twitter card meta tags
430. **Canonical URLs** - Verify canonical links
431. **Robots.txt** - Check /robots.txt exists and correct
432. **Sitemap** - Verify /sitemap.xml generated
433. **Structured Data** - Check JSON-LD schema markup
434. **Alt Text** - Verify images have alt attributes
435. **H1 Tags** - Each page has one H1 tag

---

## CATEGORY 20: SECURITY AUDIT (20 steps)

### Security Checks
436. **HTTPS** - Verify all requests use HTTPS
437. **CSRF Tokens** - Check forms have CSRF protection
438. **SQL Injection** - Test SQL injection payloads
439. **XSS Prevention** - Test XSS payloads in all inputs
440. **Auth Bypass** - Try accessing protected routes without auth
441. **Session Hijacking** - Test session security
442. **Password Hashing** - Verify passwords hashed (if using local auth)
443. **Sensitive Data** - Check no sensitive data in client code
444. **API Keys** - Verify no API keys exposed
445. **Rate Limiting** - Test rate limits on all endpoints
446. **File Upload Security** - Check file upload validation
447. **Input Sanitization** - Verify all inputs sanitized
448. **Output Encoding** - Check output is encoded
449. **CORS** - Verify CORS policy is restrictive
450. **Security Headers** - Check security headers (CSP, X-Frame-Options)
451. **Dependency Audit** - Run npm audit, check vulnerabilities
452. **Environment Variables** - Verify sensitive data in .env
453. **Error Messages** - Check errors don't leak info
454. **Admin Privilege** - Verify admin actions require admin role
455. **Data Encryption** - Check sensitive data encrypted at rest

---

## CATEGORY 21: DATABASE INTEGRITY (15 steps)

### Database Checks
456. **Foreign Keys** - Verify all FK constraints enforced
457. **Cascade Delete** - Test cascade delete works correctly
458. **Null Constraints** - Check NOT NULL constraints
459. **Unique Constraints** - Verify unique constraints work
460. **Check Constraints** - Test check constraints (e.g., coins >= 0)
461. **Default Values** - Verify default values apply
462. **Auto-increment** - Check ID auto-increment works
463. **UUID Generation** - Verify UUID generation
464. **Timestamps** - Check createdAt, updatedAt auto-set
465. **Transactions** - Test database transactions
466. **Rollback** - Verify rollback on error
467. **Concurrent Writes** - Test concurrent writes to same record
468. **Indexing** - Verify indexes exist on foreign keys
469. **Query Performance** - Check slow query log
470. **Data Migration** - Verify migrations ran successfully

---

## CATEGORY 22: INTEGRATION TESTS (15 steps)

### API Integration
471. **GET /api/stats** - Verify returns correct stats
472. **GET /api/categories** - Verify returns all categories
473. **GET /api/categories/:slug** - Verify returns category
474. **GET /api/categories/:slug/threads** - Verify returns threads
475. **POST /api/threads** - Create thread, verify response
476. **GET /api/threads** - Verify returns thread list
477. **GET /api/threads/:id** - Verify returns single thread
478. **PATCH /api/threads/:id** - Update thread, verify
479. **POST /api/feedback** - Submit feedback, verify saves
480. **GET /api/notifications** - Verify returns notifications
481. **POST /api/notifications/:id/read** - Mark read, verify
482. **GET /api/user/profile** - Verify returns profile
483. **PATCH /api/user/profile** - Update profile, verify
484. **POST /api/activity/track** - Track activity, verify coins
485. **GET /api/brokers/search** - Search brokers, verify results

---

## CATEGORY 23: USER FLOW TESTS (10 steps)

### Complete User Journeys
486. **New User Signup** - Complete full signup flow
487. **First Thread Journey** - New user creates first thread, earns coins
488. **Purchase Flow** - User earns coins, buys content, downloads
489. **Withdrawal Flow** - User requests withdrawal, gets approved
490. **Review Submission** - User buys EA, submits review
491. **Broker Review Flow** - User reviews broker, broker rating updates
492. **Profile Completion** - User completes profile, earns coins
493. **Referral Flow** - User refers friend, earns bonus
494. **Daily Check-in Flow** - User checks in daily for 7 days, earns streak bonus
495. **Admin Moderation** - Admin reviews and approves reported content

---

## CATEGORY 24: THEME & ACCESSIBILITY (10 steps)

### Theme Testing
496. **Light Mode** - Verify all pages work in light mode
497. **Dark Mode** - Switch to dark mode, verify all pages
498. **Theme Persistence** - Refresh page, verify theme persists
499. **Theme Toggle** - Toggle theme multiple times, verify smooth
500. **Contrast Ratios** - Check text contrast meets WCAG AA
501. **Keyboard Navigation** - Navigate site using only keyboard
502. **Focus Indicators** - Verify focus states visible
503. **Screen Reader** - Test with screen reader (basic)
504. **Alt Text** - All images have descriptive alt text
505. **ARIA Labels** - Check ARIA labels on interactive elements

---

## CATEGORY 25: FINAL VERIFICATION (10 steps)

### Final Checks
506. **All Routes** - Verify all routes in sitemap work
507. **All API Endpoints** - Verify all endpoints respond correctly
508. **All Buttons** - Click every button, verify no crashes
509. **All Forms** - Submit all forms with valid/invalid data
510. **All Links** - Click all nav links, verify navigate correctly
511. **Console Errors** - Check browser console for JS errors
512. **Network Tab** - Check for failed requests
513. **Memory Leaks** - Monitor memory over extended use
514. **Logs Review** - Check server logs for errors
515. **Final Integration Test** - Run full test suite, verify all pass

---

## TEST EXECUTION NOTES
- Execute tests in order
- Document all failures with screenshots
- Record actual vs expected results
- Note performance metrics
- Check calculations manually
- Verify all loops and algorithms
- Test edge cases and boundaries
- Validate all math formulas

## REPORTING FORMAT
For each failed test:
1. Test number and name
2. Expected result
3. Actual result
4. Steps to reproduce
5. Severity (critical, high, medium, low)
6. Screenshots if applicable
7. Calculation details if math-related
