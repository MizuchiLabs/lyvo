# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-03-12

### Added
- Integrated OpenAPI documentation rendering using Scalar.
- Added automated `CHANGELOG.md` rendering into a beautiful timeline UI.
- Implemented responsive padding for the main layout to improve mobile reading experience.
- Added `.npmrc` to streamline dependency management.

### Fixed
- Fixed an uncaught client-side crash in `Sidebar.tsx` when rendering `.astro` images within React.
- Fixed the Edit button overlapping on mobile by hiding it behind a desktop breakpoint.

### Changed
- Refactored `MobileSidebar` and `SidebarNav` into a unified `Sidebar` component.
- Hid default detail marker arrows in the sidebar and replaced them with custom Lucide icons.

## [1.0.0] - 2025-10-01

### Added
- Initial release of the Lyvo Documentation Theme.
- Complete support for Astro Content Collections.
- Dark mode and light mode theming system using Tailwind CSS.
- Client-side search functionality via Pagefind.
- Syntax highlighting and copy-to-clipboard functionality.

### Changed
- Configured default repository to GitHub.