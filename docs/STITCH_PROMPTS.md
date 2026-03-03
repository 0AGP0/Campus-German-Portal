# Google Stitch – Page Prompts

Use the prompts below in **Google Stitch** (stitch.withgoogle.com). Paste one prompt at a time to get screen designs. Share the output (HTML/CSS or screenshot) and we’ll integrate it into the project with Next.js and shadcn.

---

## 1. Login Page

```
Modern, minimal login page for a CRM portal. Centered card with:
- Title: "Campus German Portal"
- Subtitle: "Sign in with your email and password"
- Email input field with label "Email"
- Password input field with label "Password"
- Primary "Sign in" button, full width
- Clean white/gray background, subtle shadow on card. Desktop first, responsive. Use neutral colors and clear typography.
```

---

## 2. Admin – Dashboard Home

```
Admin dashboard home page. Header: "Admin Panel" with short description. Two cards in a grid:
1) "Users" – Manage consultant and student accounts. Short description.
2) "CRM Fields" – Define fields that appear on the student form. Short description.
Clean layout, sidebar already exists so this is just main content area. Use card components with title and description. Neutral, professional style.
```

---

## 3. Admin – User List

```
CRM admin page: user list table. Table columns: Name, Email, Role (badge: Admin / Consultant / Student), Actions (dropdown: Edit, Deactivate). Above table: "Users" title, and a primary button "Add user". Clean table with alternating row hover. Desktop first.
```

---

## 4. Admin – CRM Fields List

```
CRM admin page: list of form fields. Table columns: Field key, Label, Type (text, email, select, date), Required (Yes/No badge), Order, Actions (Edit, Delete). Title "CRM Fields", button "Add field". Clean table, professional look.
```

---

## 5. Consultant – Student List

```
Consultant dashboard: student list table. Columns: Student name, Email, Stage (dropdown or badge: Application, Documents Complete, Payment Pending, Registration Complete), Last updated, Actions (link "Details"). Title "Students", optional search/filter bar. Clean, scannable table.
```

---

## 6. Consultant – Student Detail

```
Consultant view: single student detail page. Header with student name and "Stage" dropdown to change stage. Below: section "CRM Information" with form fields (read-only or editable): Full name, Phone, Program, etc. Second section "Documents" with list of files (name, type, date, download link) and button "Upload document". Third section: "Generate PDF" with dropdown to select template and button "Download PDF". Clean sections, clear headings.
```

---

## 7. Student – Profile (CRM Form)

```
Student profile page: form to fill CRM fields. Title "My Profile". Form with fields: Full name (text), Phone (text), Program (text or select). Labels above inputs. Primary "Save" button at bottom. Simple, accessible form layout. No sidebar in the prompt – just the form card/content.
```

---

## 8. Student – Documents

```
Student documents page. Title "My Documents". Two subsections: 1) "Documents uploaded by consultant" – table or list: File name, Date, Download. 2) "My uploaded documents" – same list + "Upload document" button. Clean list/table style. Optional: "Generate PDF from template" button at top.
```

---

## Usage notes

- Stitch output is usually **HTML/CSS** or **Figma**. If you get HTML, we’ll convert it to React + shadcn components and integrate.
- To tweak style, add to the prompt (e.g. "primary color blue", "font Inter").
- For mobile layout, add at the end: "Mobile responsive, stack on small screens."
