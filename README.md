# Lucknow University Previous Year Papers

A modern, minimal frontend project to browse Lucknow University previous year question papers with filtering, search, pagination, and responsive UI.

## Overview

This project provides:

- A polished homepage with sections like hero, features, papers, about, and footer
- A dynamic paper listing with course/year/semester filters
- A separate **Browse Papers** page for focused paper discovery
- Modal-based paper preview and details flow on the homepage
- Responsive layout optimized for desktop, tablet, and mobile

## Features

- **Smart filtering** by:
  - Course
  - Year
  - Semester
- **Search support** for subject/course/exam type
- **Pagination** for clean browsing
- **Modern UI/UX** with minimal styling and smooth interactions
- **Sticky navigation** with active section highlight
- **Accessible patterns**:
  - Skip link
  - Focus handling for modals
  - Keyboard escape support for overlays

## Project Structure

```text
previous-year-question-papers/
├── index.html           # Main homepage
├── browse-papers.html   # Separate browse page
├── style.css            # Global styles
├── script.js            # Homepage behavior and rendering
├── browse-papers.js     # Browse page rendering and filters
├── index.js             # Paper dataset + default filters
└── README.md
```

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript (ES Modules)

No external framework is required.

## Getting Started

1. Clone or download the project.
2. Open the folder in your editor.
3. Run with a local server (recommended for ES module imports).

Example (VS Code Live Server or any static server):

```bash
# Python
python -m http.server 5500
```

Then open:

- `http://localhost:5500/index.html`

## Usage

- On the homepage:
  - Use course tabs and filters in the papers section
  - Open paper details and preview via action buttons
  - Click **Browse Papers** to open the dedicated browse page

- On `browse-papers.html`:
  - Search and filter through all available papers
  - Navigate results with pagination
  - Open paper links directly from cards

## Data Source

Paper records are currently stored in `index.js` as a static array (`papers`).

Each record includes:

- `id`
- `course`
- `semester`
- `subject`
- `year`
- `exam`
- `link`

You can update this array to add/edit papers.

## Customization

- Update theme variables in `style.css` (`:root`) to change colors and spacing.
- Edit section content in `index.html`.
- Extend filter logic in `script.js` / `browse-papers.js`.

## Future Improvements

- Connect to backend/database instead of static data
- Add authentication and admin upload panel
- Add paper download analytics
- Add dark mode toggle

## License

This project is for educational use.  
You can adapt and extend it for your own university paper archive.
