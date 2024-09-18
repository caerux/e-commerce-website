# Project 1: E-Commerce Website

## Overview

Create an e-commerce website showing inventory with product details and cart functionality.

---

## Table of Contents

- [Functional Requirements](#functional-requirements)
  - [Landing Page (Products Page)](#landing-page-products-page)
  - [Product Detail Page](#product-detail-page)
  - [Cart Page and Functionality](#cart-page-and-functionality)
  - [Login Page](#login-page)
- [General Instructions](#general-instructions)
- [Extensions](#extensions)
  - [Home Page](#home-page)
  - [Checkout Page](#checkout-page)
  - [Order Upload Page](#order-upload-page)
- [Progress Tracking](#progress-tracking)
- [Notes](#notes)
- [Setup Instructions](#setup-instructions)
- [Technologies Used](#technologies-used)
- [Contact](#contact)

---

## Functional Requirements

### Landing Page (Products Page)

- [ ] **1. Display Available Products**
  - [ ] The user should be able to see the list of all the available products.
    - The list of products should be maintained as a JSON file and fetched via AJAX call.
- [ ] **2. Show Product Attributes**
  - [ ] All the product attributes should be shown on screen along with its image.
- [ ] **3. Add/Remove Products to/from Cart**
  - [ ] The user should be able to add products to the cart from the home page.
  - [ ] The user should be able to remove products from the cart from the home page.
- [ ] **4. Indicate Products in Cart**
  - [ ] The user should be able to identify which products are currently present in the cart (along with their quantity).

### Product Detail Page

- [ ] **1. Display Product Details**
  - [ ] The user should be able to see all the details of a particular product when they click on a product from the home screen or when opening it in a new tab.
- [ ] **2. Cart Interactions on Detail Page**
  - [ ] Identify if the current product is present in the cart (along with the quantity).
  - [ ] Add product to the cart.
  - [ ] Remove product from the cart.

### Cart Page and Functionality

- [ ] **1. Cart Operations**
  - [ ] View all the products added to cart along with image, name, MRP, and quantity.
  - [ ] Increase the product quantity.
  - [ ] Decrease the product quantity.
  - [ ] Delete the product from cart.
  - [ ] Clear the cart.
  - [ ] View the product details on click of the product name/image.
  - [ ] View the order summary and total.
  - [ ] Checkout and place the order.
- [ ] **2. Persist Cart Items**
  - [ ] The products in the cart should be persisted even when the user refreshes the page or navigates to a different page.
- [ ] **3. Handle Duplicate Products**
  - [ ] If the same product is added to cart more than once, the cart should increment the quantity instead of displaying the same product multiple times.
- [ ] **4. Redirect to Login on Checkout**
  - [ ] If a user is not logged in, then on click of Checkout, the UI should take the user to the login page.
- [ ] **5. Complete Checkout After Login**
  - [ ] Once logged in, the user should be able to check out and place the order.

### Login Page

- [ ] **1. Validate Against User List**
  - [ ] A user list should be maintained as a JSON file locally.
  - [ ] The login should be validated against this list via AJAX call.
- [ ] **2. Maintain Login State**
  - [ ] Once logged in, even if the UI is refreshed, the user should remain logged in until they manually log out.
- [ ] **3. Redirect if Already Logged In**
  - [ ] If the user navigates to the login page after logging in (by entering the URL in the address bar manually), the UI should redirect to the home page.
- [ ] **4. Omit Signup Option**
  - [ ] Signup option is not required.
- [ ] **5. Merge Cart Items After Login**
  - [ ] If the user has added products to the cart before login and also has products in their account's cart, then after successful login, the current cart items should be merged into the user's existing cart.

---

## General Instructions

- [ ] **1. Page Accessibility**
  - [ ] All pages in the application should be accessible to the user even before logging in.
- [ ] **2. Login Requirement for Checkout**
  - [ ] Only the cart checkout functionality requires the user to be logged in.
- [ ] **3. Footer**
  - [ ] All the pages should have a basic footer placed at the bottom of the screen at all times.
    - If the page content is more, the footer should be at the bottom of the screen and visible only when scrolled to the end.
  - [ ] The footer should display the current date and time as per the system, formatted properly.
- [ ] **4. Navigation Bar**
  - [ ] All the pages should have a navigation bar with links to go to different pages.
  - [ ] The navigation bar should be fixed at the top even during page scroll.
  - [ ] The number of items present in the cart should be displayed at all times in the navigation bar.
- [ ] **5. Visual Feedback for AJAX Requests**
  - [ ] The UI should have proper visual feedback for every AJAX request made on the screen.
- [ ] **6. Message Feedback for AJAX Responses**
  - [ ] Users should get success or error messages for AJAX responses.
    - Use Bootstrap toast to achieve this.
- [ ] **7. Confirmation on Delete Actions**
  - [ ] Get confirmation from the user whenever a delete action is made (product is deleted from cart or when cart is cleared).
- [ ] **8. Unlimited Inventory**
  - [ ] The product inventory need not be maintained.
    - All products should be considered to have unlimited inventory.

---

## Extensions

### Home Page

- [ ] **Product Filtering**
  - [ ] The user should be able to filter the products based on certain attributes on the products page.
  - [ ] The filters should be persistent in the current tab until the user logs out or resets the filter.

### Checkout Page

- [ ] **Download Order Details**
  - [ ] Once the order is successfully placed, the order details should be downloaded as a CSV file.

### Order Upload Page

- [ ] **1. CSV Upload Screen**
  - [ ] There should be a separate screen to place the order via CSV upload.
- [ ] **2. Sample CSV Template**
  - [ ] Provide an option to download the sample CSV template.
    - The template CSV should have only the headers.
- [ ] **3. CSV Validations**
  - [ ] Handle the following CSV validations:
    - [ ] Header validations.
    - [ ] Value validations.
    - [ ] Product validation.
- [ ] **4. Maximum Row Validation**
  - [ ] Add a validation on the maximum number of rows allowed in the CSV file.
- [ ] **5. Error Messages for Invalid CSV**
  - [ ] Proper error messages should be displayed on the UI if an invalid CSV is uploaded.
- [ ] **6. Display Uploaded Products**
  - [ ] The user should be able to see the product and quantity details uploaded in the CSV on the UI (in a table or any other format).
- [ ] **7. Handle Duplicate Products in CSV**
  - [ ] If the same product is added in the CSV more than once, then the product quantity should be incremented instead of displaying the same product multiple times.
- [ ] **8. Place Order After Validations**
  - [ ] The user should be able to place the order only when all the CSV validations are passed.

---

## Progress Tracking

Use the checkboxes above to track your progress as you implement each feature. Check off each item as it's completed to keep an organized record of your development process.

---

## Notes

- Ensure consistent styling across all pages using a CSS framework like Bootstrap.
- Focus on responsiveness and user experience.
- Keep code modular and maintainable.
- Write comments and documentation where necessary.
- Consider edge cases and handle errors gracefully.

---
