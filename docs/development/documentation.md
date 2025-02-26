[Home](../index.md) > [Development](index.md) > Documentation Guide

# Documentation Guide

This guide covers how to update and maintain the project documentation.

## Local Development

1. Install MkDocs Material theme:
    ```bash
    pip install mkdocs-material
    ```

2. Serve documentation locally:
    ```bash
    mkdocs serve
    ```
    This will start a local server at `http://127.0.0.1:8000`

3. Build documentation (optional):
    ```bash
    mkdocs build
    ```
    This creates a `site` directory with the static site

## Documentation Structure

```tree
docs/
├── index.md              # Home page
├── user/                 # User documentation
│   ├── config.md         # Configuration guide
│   └── usage.md          # Usage instructions
├── development/          # Developer documentation
│   ├── index.md          # Development overview
│   ├── architecture.md   # System architecture
│   ├── diagrams.md       # Flow diagrams
│   ├── documentation.md  # Documentation guide
│   ├── contributing.md   # Contribution guidelines
│   ├── maintenance.md    # Maintenance guide
│   ├── publishing.md     # Publishing guide
│   └── ...               # Other guides
├── privacy.md            # Privacy policy
└── license.md            # License information
```

## Updating Documentation

1. **Code Changes**: When updating functionality, always:
    - Update relevant user guides
    - Update architecture docs if the change affects system design
    - Add new documentation for new features

2. **Markdown Guidelines**:
    - Use proper heading hierarchy (h1 > h2 > h3)
    - Include breadcrumbs at the top of each page
    - Add code examples in appropriate language blocks
    - Use relative links between pages

3. **Diagrams**:
    - Use Mermaid for flow diagrams
    - Update diagrams when workflow changes
    - Test diagram rendering locally

## Automated Publishing

Documentation is automatically published when:
1. A new version tag is pushed (v*)
2. The tag is not a release candidate (*-rc*)

The GitHub Actions workflow:
1. Builds the documentation using MkDocs
2. Deploys to GitHub Pages
3. Makes docs available at our documentation URL

## Best Practices

1. **Local Testing**:
    - Always preview changes locally using `mkdocs serve`
    - Check all links work correctly
    - Verify Mermaid diagrams render properly

2. **Navigation**:
    - Keep the `nav` section in `mkdocs.yml` organized
    - Maintain logical grouping of pages
    - Update navigation when adding new pages

3. **Maintenance**:
    - Review documentation during releases
    - Remove outdated information
    - Keep examples current with latest version
