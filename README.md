# Travel Buddy

A travel companion application to help plan and organize your trips.

## Setup

1. First, remove any nested Git repositories:
```bash
rmdir /s /q Travel_Buddy\.git
```

2. Initialize the Git repository in the root folder:
```bash
git init
git add .
git commit -m "Initial commit"
```

## Development

[Add your development instructions here]

### Handling Git Errors

If you encounter an error when pushing to the remote repository, follow these steps:

1. Pull the remote changes allowing unrelated histories:
```bash
git pull origin main --allow-unrelated-histories
```

2. Resolve any merge conflicts if they arise.

3. Commit the merge:
```bash
git commit -m "Merge remote-tracking branch 'origin/main'"
```

4. Push the changes to the remote repository:
```bash
git push origin main
```
