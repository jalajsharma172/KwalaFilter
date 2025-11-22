# Design Guidelines: Real-Time EVM Event Listener Platform

## Design Approach
**Design System**: Custom dark-themed dashboard following Material Design principles for data-intensive applications with real-time monitoring capabilities.

**Core Philosophy**: Professional blockchain development tool with emphasis on readability, real-time data visualization, and technical precision. The design prioritizes clarity and functionality for developers monitoring smart contract events.

---

## Typography

**Font Families**:
- Primary: System font stack (font-sans) for UI elements
- Monospace: 'Consolas', 'Monaco', monospace for code, JSON, addresses, and transaction data

**Hierarchy**:
- Page Title (h1): text-4xl, font-extrabold
- Section Headers (h2): text-2xl, font-semibold  
- Labels: text-sm, font-medium
- Body Text: text-sm, standard weight
- Helper Text: text-xs
- Code/Technical: text-xs to text-sm, monospace

---

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 10 as primary spacing values (p-2, p-4, m-6, gap-8, mb-10)

**Container Structure**:
- Main wrapper: max-w-4xl mx-auto with outer padding p-4 md:p-8
- Content sections: Full-width within container
- Component padding: p-6 for cards/panels
- Grid gaps: gap-4 to gap-6

**Responsive Breakpoints**:
- Mobile: Single column, full-width inputs
- Desktop (md:): Two-column grid for form fields

---

## Component Library

### Header
- Centered alignment
- Primary title in indigo-400 with gradient-ready styling
- Subtitle in muted gray-400
- Bottom margin mb-10

### Configuration Panel
- Background: bg-gray-800 with rounded-xl corners
- Shadow: shadow-2xl for depth
- Two-column responsive grid (grid-cols-1 md:grid-cols-2)
- Input fields with consistent styling
- Inline helper text below each input

### Input Fields
- Background: bg-gray-700
- Border: border-gray-600 with focus:ring-2 focus:ring-indigo-500
- Padding: px-4 py-2 for single-line, px-4 py-3 for textarea
- Rounded: rounded-lg
- Placeholder: placeholder-gray-500

### Buttons
- Primary Action: bg-indigo-600 hover:bg-indigo-500 with transform hover:scale-[1.02]
- Destructive Action: bg-red-600 hover:bg-red-500
- Padding: py-3 px-6
- Font: font-bold
- Rounded: rounded-lg with shadow-lg
- Disabled state: opacity-50 with cursor-not-allowed
- Transition: duration-150 ease-in-out

### Status Message Box
- Dynamic color states:
  - Success: bg-green-900 border-green-700 text-green-300
  - Error: bg-red-900 border-red-700 text-red-300
  - Info: bg-gray-700 border-gray-600 text-gray-400
  - Warning: bg-yellow-900 border-yellow-700 text-yellow-300
- Padding: p-3 with rounded-lg
- Transition: transition-all duration-500

### Log Output Panel
- Container: bg-gray-800 with rounded-xl and border-gray-700
- Height: h-96 with overflow-y-auto
- Internal spacing: space-y-4
- Custom scrollbar with indigo-500 thumb

### Log Entry Cards
- Background: bg-gray-700 for event logs
- Border accent: border-l-4 border-indigo-500
- Padding: p-3
- Rounded: rounded-lg
- Event title: font-bold text-indigo-400
- Technical details: text-xs in monospace
- Timestamp: text-gray-500 in brackets
- Links: text-blue-400 hover:text-blue-300

---

## Color Palette

**Backgrounds**:
- Primary: bg-gray-900 (body)
- Secondary: bg-gray-800 (panels)
- Tertiary: bg-gray-700 (inputs, cards)

**Accents**:
- Primary: Indigo (indigo-400, indigo-500, indigo-600) for CTAs and highlights
- Success: Green-900/700/300
- Error: Red-900/700/300
- Warning: Yellow-900/700/300

**Text**:
- Primary: white
- Secondary: gray-300, gray-400
- Muted: gray-500
- Code/Data: gray-200

**Interactive**:
- Links: blue-400 hover:blue-300
- Focus rings: ring-indigo-500
- Borders: gray-600, gray-700

---

## Special Features

**Custom Scrollbar**:
- Width: 8px
- Thumb: indigo-500 with 4px border-radius
- Track: gray-900 (dark)

**Monospace Display**:
- Class: text-json for JSON/code content
- White-space: pre-wrap with word-wrap: break-word
- Used for: ABI input, log arguments, addresses, hashes

**Transitions**:
- Standard: transition-all duration-300 for panels
- Quick: duration-150 ease-in-out for buttons
- Smooth: duration-500 for status messages

---

## Images
**No hero images required** - This is a technical dashboard/tool focused on functionality over marketing. All visual interest comes from the dark theme, accent colors, and real-time data display.

---

## Accessibility & UX

- All form inputs have clear labels and helper text
- Button states clearly indicate enabled/disabled status
- Real-time feedback through status messages
- Color-coded log types for quick scanning
- Clickable transaction hashes linking to Etherscan
- Timestamps on all events for temporal context
- Responsive design maintains usability on all devices