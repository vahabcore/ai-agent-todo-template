# Contributing to AI Agent Todo Template

First off, thanks for taking the time to contribute! 🎉 

The following is a set of guidelines for contributing to this project. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## How Can I Contribute?

### Reporting Bugs
This section guides you through submitting a bug report. Following these guidelines helps maintainers and the community understand your report, reproduce the behavior, and find related reports.
- Use the provided **Bug Report** issue template.
- Explain the problem and include additional details to help maintainers reproduce the problem.
- Provide specific examples to demonstrate the steps to reproduce the issue.

### Suggesting Enhancements
This section guides you through submitting an enhancement suggestion, including completely new features and minor improvements to existing functionality.
- Use the provided **Feature Request** issue template.
- Describe the current behavior and explain which behavior you expected to see instead and why.

### Pull Requests
- Fill in the **Pull Request Template** completely.
- Do not include issue numbers in the PR title.
- Make sure your code lints (`npm run lint`) and builds (`npm run build`) before opening a PR.
- Follow the existing code style, especially when working on LangGraph agent logic or MongoDB schemas.

## Local Development Setup

1. Fork the repo and create your branch from `main`.
2. Run `npm install` in the repository root.
3. Install and run [Ollama](https://ollama.com/) locally. Pull the required model (`ollama pull llama3.1:8b`).
4. Set up your local MongoDB and add the `MONGODB_URI` environment variable.
5. Make your changes and test them using `npm run dev`.

Thank you for helping make this template better!
