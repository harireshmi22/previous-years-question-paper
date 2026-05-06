# Lucknow University Previous Year Papers

A responsive, modern frontend project for exploring Lucknow University previous year question papers with smart filtering and clean UX.

## Project Overview

This project includes two user-facing pages:

- `index.html` (homepage): overview sections + featured paper browsing + modal preview/details.
- `browse-papers.html`: dedicated paper discovery page with dynamic filtering and pagination.

The UI is built with a minimal, modern style and tuned for desktop, laptop, tablet, and mobile screens.

## Current Features

- Dynamic paper rendering from a centralized dataset (`index.js`)
- Search by subject/course/exam
- Filters by:
  - course
  - year
  - semester
- Pagination for paper cards
- Modern card-based layout
- Responsive navigation and section layout
- Dedicated Browse Papers page
- Modal preview/details flow on homepage
- Accessibility basics:
  - skip link
  - keyboard escape support for modals
  - semantic sectioning and labels

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript (ES Modules)

No framework or build tool is required.

## Folder Structure

```text
previous-year-question-papers/
├── index.html            # Homepage
├── browse-papers.html    # Dedicated browse page
├── style.css             # Shared global styles and responsive breakpoints
├── index.js              # Paper dataset + default filter state
├── script.js             # Homepage interactions and rendering
├── browse-papers.js      # Browse page rendering/filter logic
└── README.md
```

## Run Locally

Use a local static server (recommended for module imports):

```bash
python -m http.server 5500
```

Open:

- `http://localhost:5500/index.html`

## Usage

### Homepage (`index.html`)

- Navigate sections from top navbar.
- Use the Papers section to search/filter quick results.
- Open paper details or preview from card actions.
- Use `Browse Papers` button to switch to full listing page.

### Browse Page (`browse-papers.html`)

- Use course tabs for quick category switching.
- Apply search/year/semester filters.
- Browse paginated cards and open paper links.
- Use `Back to Home` button to return.

## Data Model

Paper records are stored in `index.js` under `papers`.

Each paper object:

- `id`
- `course`
- `semester`
- `subject`
- `year`
- `exam`
- `link`

Update this dataset to add/edit papers.

## Styling and Responsiveness

- Theme tokens live in `:root` inside `style.css`.
- Breakpoints currently cover:
  - large desktop
  - desktop/laptop
  - tablet
  - mobile
  - small mobile
- Layout, typography, navigation, and card grids are tuned across breakpoints.

## Future Enhancements

- Backend/API integration for live paper data
- Admin panel for uploading/managing papers
- Authentication/authorization
- Paper analytics and usage tracking
- Dark mode support

## License

This project is intended for educational use and can be adapted for university paper archives.
