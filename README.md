# QA Checklist Automation

A web-based tool for QA teams to create, manage, and execute test checklists with multi-tester collaboration.

**Live App**: https://qa-checklist-automation.vercel.app/

---

## Table of Contents
- [Introduction](#introduction)
- [Getting Started](#getting-started)
- [Module Library](#module-library)
- [Managing Projects](#managing-projects)
- [Building Checklists](#building-checklists)
- [Executing Tests](#executing-tests)
- [Progress Tracking](#progress-tracking)
- [Profile Settings](#profile-settings)
- [Tips & Best Practices](#tips--best-practices)

---

## Introduction

### What is QA Checklist Automation?

QA Checklist Automation helps QA teams:

- **Create reusable test modules** - Build a library of test cases organized into modules
- **Build custom checklists** - Pick and choose modules for each testing project
- **Collaborate in real-time** - Multiple testers can work on the same checklist simultaneously
- **Track progress** - Visual progress bars and statistics at a glance
- **Document findings** - Add notes and upload screenshots to test results

### Key Features

| Feature | Description |
|---------|-------------|
| Module Library | Central repository of reusable test modules |
| Drag-and-Drop | Easily reorder modules and test cases |
| Multi-Tester | Assign multiple testers to work together |
| Real-Time Sync | Changes sync every 5 seconds across all testers |
| Image Attachments | Upload screenshots directly to test results |
| Progress Tracking | Visual progress bars with status breakdowns |
| CSV Import/Export | Bulk import/export modules |

---

## Getting Started

### Step 1: Sign In

1. Go to https://qa-checklist-automation.vercel.app/
2. Click **"Sign in with Google"**
3. Authenticate with your Google account
4. You'll be redirected to the Projects page

### Step 2: First-Time Setup

When you sign in for the first time:
- A tester profile is automatically created using your Google name
- You're assigned a random avatar color
- You can customize your name and color later (see [Profile Settings](#profile-settings))

### Navigation

| Tab | Purpose |
|-----|---------|
| **Dashboard** | View your assigned projects |
| **Projects** | Manage all test projects |
| **Modules** | Manage the module library |

---

## Module Library

The Module Library is where you create and organize reusable test content.

### What is a Module?

A **module** is a group of related test cases. For example:
- "Login Flow" module containing: Login with email, Login with Google, Forgot password
- "Character Abilities" module containing: Basic attack, Special skill, Ultimate ability

### Creating a Module

1. Go to **Modules** tab
2. Click **"New Module"**
3. Fill in:
   - **Name** (required) - e.g., "Login Flow"
   - **Description** - What this module tests
   - **Thumbnail** - Optional 64x64 image
   - **Tags** - For organization (e.g., "authentication", "critical")
4. Click **Create**

### Adding Test Cases

1. Click on a module to expand it
2. Click **"Add Test Case"**
3. Fill in:
   - **Title** (required) - e.g., "User can login with email"
   - **Description** - Steps or expected behavior
   - **Priority** - High, Medium, or Low
4. Click **Add**

### Organizing Modules

- **Drag to reorder** - Grab the drag handle and move modules up/down
- **Search** - Use the search bar to find modules by name, description, or tags
- **Tags** - Filter modules by tags
- **View modes** - Toggle between Compact and Big views

### Import/Export

**Export to CSV:**
1. Click **"Export CSV"** button
2. Downloads all modules with their test cases
3. Use for backup or sharing with other teams

**Import from CSV:**
1. Click **"Import CSV"** button
2. Select a CSV file with module data
3. Preview changes (new modules, updates)
4. Click **Confirm Import**

CSV Format:
```
Module Name,Module Description,Module Tags,Test Case Title,Test Case Description,Priority
Login Flow,Authentication tests,auth;critical,Login with email,User enters email and password,High
Login Flow,Authentication tests,auth;critical,Login with Google,User clicks Google OAuth,Medium
```

---

## Managing Projects

A **project** represents a testing cycle, such as "v2.5 Release" or "Holiday Event Patch".

### Creating a Project

1. Go to **Projects** tab
2. Click **"New Project"**
3. Fill in:
   - **Name** (required, unique)
   - **Description** - What's being tested
   - **Version** - e.g., "2.5.0"
   - **Platform** - e.g., "iOS", "Android", "Web"
   - **Priority** - High, Medium, or Low
   - **Due Date** - Testing deadline
4. Click **Create**

### Project Statuses

| Status | Meaning |
|--------|---------|
| **Draft** | Checklist is being built, no tests executed |
| **In Progress** | Testing has started (at least one test completed) |
| **Completed** | All tests have been executed |

Status is calculated automatically based on test progress.

### Finding Projects

- **Search** - Find by name, description, version, or platform
- **Filter by Status** - Show only Draft, In Progress, or Completed
- **Filter by Platform** - Show only iOS, Android, etc.
- **Sort** - By name, due date, created date, or status

### Project Actions

| Action | How |
|--------|-----|
| View Overview | Click on project card |
| Edit Details | Click pencil icon on card |
| Delete | Click trash icon on card (with confirmation) |

---

## Building Checklists

After creating a project, you need to build its checklist by adding modules.

### Edit Mode

1. Open a project
2. Click **"Edit Checklist"**

### Adding Modules

1. Click **"Add Module"**
2. Browse the module library
3. Select a module
4. Optionally set:
   - **Instance Label** - Custom name (e.g., "Ayaka", "Zhongli" for character tests)
5. Click **Add**

You can add the same module multiple times with different labels!

### Customizing the Checklist

- **Drag to reorder** - Move modules up/down in the checklist
- **Add custom test cases** - Click "+" on a module to add project-specific tests
- **Remove modules** - Click the trash icon

### Assigning Testers

1. In Edit mode, find **"Assigned Testers"** section
2. Click **"Assign Tester"**
3. Select testers from the list
4. Each assigned tester gets their own copy of test results

### Saving Changes

- Click **"Save Changes"** to persist your edits
- Click **"Discard"** to undo all changes
- Warning appears if you try to leave with unsaved changes

---

## Executing Tests

Work mode is where you actually run through the tests and record results.

### Starting Testing

1. Open a project
2. Click **"Start Testing"** or navigate to Work mode

### The Work Interface

```
┌──────────────────────────────────────────────────────────┐
│  [Progress Bar: ████████░░░░ 67%]                        │
│  Total: 24  |  Pending: 8  |  Pass: 14  |  Fail: 2       │
├──────────────────────────────────────────────────────────┤
│  Module: Login Flow                                      │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ ○ Login with email          [P] [F] [S] [-]         │ │
│  │   Steps: Enter email, enter password, click login   │ │
│  │   Notes: [___________________________]              │ │
│  │   Images: [Upload] [📷 2 attached]                  │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Updating Test Status

Click one of the status buttons:

| Button | Status | Meaning |
|--------|--------|---------|
| **P** (Green) | Pass | Test passed successfully |
| **F** (Red) | Fail | Test failed, found a bug |
| **S** (Yellow) | Skipped | Test skipped (not applicable or blocked) |
| **-** (Gray) | Pending | Test not yet executed (default) |

### Adding Notes

1. Click on the notes field for a test case
2. Type your notes (max 2000 characters)
3. Notes auto-save after you stop typing

Examples of useful notes:
- "Bug: Button doesn't respond on first tap"
- "Edge case: Works with 5 items, fails with 6+"
- "Performance: Takes 3 seconds to load"

### Uploading Screenshots

1. Click **"Upload"** or the image icon
2. Select image(s) from your computer
3. Or **drag and drop** images
4. Or **paste** from clipboard (Ctrl+V / Cmd+V)

Supported formats: JPEG, PNG, GIF, WebP (max 5MB each)

### Viewing Attachments

- Click on thumbnail to open full-size view
- Navigate between images with arrows
- Click outside or X to close

### Multi-Tester Collaboration

When multiple testers are assigned:

**View Modes:**
- **All View** - See all testers' results side by side
- **Single View** - Focus on your own results

**Real-Time Updates:**
- Results sync every 5 seconds
- See when others update their statuses
- Each tester's notes and attachments are separate

**Color Coding:**
- Each tester has a unique color
- Colors appear on avatars and indicators
- Easy to identify who did what

### Quick Actions

| Action | How |
|--------|-----|
| Collapse all modules | Click "Collapse All" |
| Expand all modules | Click "Expand All" |
| Collapse passed tests | Click "Collapse Passed" |
| Filter by status | Use status filter dropdown |
| Search test cases | Use search bar |

---

## Progress Tracking

### Project Overview

The Overview page shows at-a-glance statistics:

**Progress Bar:**
```
[███████████░░░░░░░░░] 55%
 ▲ Green   ▲ Red  ▲ Yellow
 (Pass)   (Fail) (Skipped)
```

**Statistics Cards:**
| Metric | Shows |
|--------|-------|
| Total | Number of test cases |
| Pending | Not yet tested |
| Pass | Successful tests (green) |
| Fail | Failed tests (red) |
| Skipped | Skipped tests (yellow) |

### Module-Level Progress

Each module shows:
- Test count
- Status breakdown (pending/pass/fail/skipped)
- Mini progress bar

### Hover Indicators

On the Overview page, hover over icons to see:
- **Note icon** (blue) - Preview of tester notes
- **Image icon** (purple) - Count and thumbnails of attachments

---

## Profile Settings

### Editing Your Profile

1. Click your name in the top-right corner
2. Click **"Edit Profile"**
3. Update:
   - **Display Name** (1-15 characters)
   - **Avatar Color** (8 preset colors)
4. Click **Save**

### Available Colors

| Color | Name |
|-------|------|
| Blue | #00A8E8 |
| Orange | #FF6B35 |
| Purple | #7D5BA6 |
| Teal | #00C9A7 |
| Yellow | #FFB81C |
| Red | #E63946 |
| Green | #06BA63 |
| Pink | #F72585 |

### Signing Out

1. Click your name in the top-right
2. Click **"Sign Out"**

---

## Tips & Best Practices

### Organizing Your Module Library

1. **Use consistent naming** - "Feature - Subfeature" format
2. **Add descriptions** - Help others understand what to test
3. **Use tags** - Group related modules (e.g., "critical", "regression", "new-feature")
4. **Set priorities** - Mark critical tests as "High" priority
5. **Keep modules focused** - 5-15 test cases per module is ideal

### Running Efficient Test Sessions

1. **Assign clear ownership** - Each tester knows their modules
2. **Use instance labels** - When testing same thing multiple times (e.g., characters)
3. **Add notes liberally** - Future you will thank you
4. **Screenshot failures** - Visual evidence helps developers
5. **Don't skip lightly** - Document why tests were skipped

### Team Collaboration

1. **Use different colors** - Easy to see who tested what
2. **Check progress regularly** - Overview page shows real-time stats
3. **Coordinate on failed tests** - Notes help others understand issues
4. **Re-test after fixes** - Change status from Fail to Pass when fixed

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+V / Cmd+V | Paste screenshot from clipboard |
| Escape | Close modals and lightbox |
| Tab | Navigate between fields |

---

## Troubleshooting

### Common Issues

**"Changes not saving"**
- Check your internet connection
- Look for error messages in red
- Try refreshing the page

**"Can't see other tester's updates"**
- Updates sync every 5 seconds
- Make sure you're in "All View" mode
- Check if tester is assigned to the project

**"Images not uploading"**
- Check file size (max 5MB)
- Check file type (JPEG, PNG, GIF, WebP only)
- Try refreshing and re-uploading

**"Project shows wrong status"**
- Status is calculated automatically
- Make sure all testers have updated their results
- Check if any tests are still "Pending"

### Getting Help

If you encounter issues:
1. Refresh the page
2. Try signing out and back in
3. Check browser console for errors
4. Contact the development team

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 2024 | Initial release with full feature set |

---

**Happy Testing!**
