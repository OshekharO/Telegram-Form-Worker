# Telegram Contact Form Worker

A lightweight Formspree-like contact form backend using **Cloudflare Workers** and the **Telegram Bot API**.

Submit form data to your Worker endpoint and receive submissions directly in Telegram.

---

## Live Endpoint

```txt
https://contact.oshekher.workers.dev/f/contact
```

---

## Features

- Sends contact form submissions to Telegram
- Formspree-like endpoint structure
- Supports multiple forms using `/f/:formName`
- Supports JSON and standard HTML form submissions
- CORS enabled
- Optional honeypot spam protection
- Optional custom subject field
- Optional redirect after submission

---

## Endpoint Format

```txt
/f/:formName
```

### Examples

```txt
/f/contact
/f/support
/f/quote
/f/newsletter
```

For this project:

```txt
https://contact.oshekher.workers.dev/f/contact
```

---

## Environment Variables

Add these secrets/environment variables in Cloudflare Workers:

```env
BOT_TOKEN=your_telegram_bot_token
CHAT_ID=your_telegram_chat_id
```

Using Wrangler:

```bash
wrangler secret put BOT_TOKEN
wrangler secret put CHAT_ID
```

---

## Basic HTML Form

```html
<form action="https://contact.oshekher.workers.dev/f/contact" method="POST">
  <input type="text" name="name" placeholder="Your name" required>

  <input type="email" name="email" placeholder="you@example.com" required>

  <input type="text" name="subject" placeholder="Subject">

  <textarea name="message" placeholder="Your message" required></textarea>

  <button type="submit">Send Message</button>
</form>
```

---

## Bootstrap Contact Form Example

```html
<form 
  class="form-neu" 
  id="contactForm" 
  action="https://contact.oshekher.workers.dev/f/contact" 
  method="POST"
>
  <div class="row g-3">

    <div class="col-sm-6">
      <label for="formName" class="form-label">Name</label>
      <input 
        type="text" 
        class="form-control" 
        id="formName" 
        name="name"
        placeholder="Your name" 
        required
      >
    </div>

    <div class="col-sm-6">
      <label for="formEmail" class="form-label">Email</label>
      <input 
        type="email" 
        class="form-control" 
        id="formEmail" 
        name="email"
        placeholder="you@email.com" 
        required
      >
    </div>

    <div class="col-12">
      <label for="formSubject" class="form-label">Subject</label>
      <input 
        type="text" 
        class="form-control" 
        id="formSubject" 
        name="subject"
        placeholder="What's this about?"
      >
    </div>

    <div class="col-12">
      <label for="formMessage" class="form-label">Message</label>
      <textarea 
        class="form-control" 
        id="formMessage" 
        name="message"
        rows="4" 
        placeholder="Tell me about your project or idea..." 
        required
      ></textarea>
    </div>

    <input type="text" name="_gotcha" style="display:none">

    <input 
      type="hidden" 
      name="_subject" 
      value="New contact form submission"
    >

    <div class="col-12">
      <button type="submit" class="btn-accent">
        Send Message
      </button>
    </div>

  </div>
</form>
```

---

## AJAX Submit

```html
<form class="form-neu" id="contactForm" novalidate>
</form>

<script>
  const contactForm = document.getElementById("contactForm");
  const formStatus = document.getElementById("formStatus");
  const submitBtn = document.getElementById("submitBtn");

  contactForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!contactForm.checkValidity()) {
      formStatus.textContent =
        "Please fill in all required fields correctly.";
      formStatus.style.color = "red";
      return;
    }

    submitBtn.disabled = true;
    formStatus.textContent = "Sending...";

    const formData = new FormData(contactForm);

    try {
      const response = await fetch(
        "https://contact.oshekher.workers.dev/f/contact",
        {
          method: "POST",
          body: formData
        }
      );

      const result = await response.json();

      if (result.success) {
        formStatus.textContent = "Message sent successfully!";
        formStatus.style.color = "green";
        contactForm.reset();
      } else {
        formStatus.textContent =
          result.message || "Something went wrong.";
        formStatus.style.color = "red";
      }
    } catch (error) {
      formStatus.textContent =
        "Failed to send. Please try again.";
      formStatus.style.color = "red";
    }

    submitBtn.disabled = false;
  });
</script>
```

---

## Special Fields

### Custom Subject

```html
<input
  type="hidden"
  name="_subject"
  value="New portfolio contact message"
>
```

### Redirect After Submit

```html
<input
  type="hidden"
  name="_redirect"
  value="https://example.com/thank-you.html"
>
```

### Honeypot Spam Protection

```html
<input type="text" name="_gotcha" style="display:none">
```

---

## Test With ReqBin

### URL

```txt
https://contact.oshekher.workers.dev/f/contact
```

### Method

```txt
POST
```

### Header

```txt
Content-Type: application/json
```

### Body

```json
{
  "name": "Test User",
  "email": "test@example.com",
  "subject": "Testing from ReqBin",
  "message": "Hello, this is a test message from ReqBin."
}
```

### Expected Response

```json
{
  "success": true,
  "message": "Form submitted successfully"
}
```

---

## Test With cURL

```bash
curl -X POST "https://contact.oshekher.workers.dev/f/contact" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "subject": "Testing from cURL",
    "message": "Hello from cURL."
  }'
```

---

## Response Format

### Success

```json
{
  "success": true,
  "message": "Form submitted successfully"
}
```

### Error

```json
{
  "success": false,
  "message": "Failed to send message"
}
```

---

## Important

Form fields must include `name` attributes.

### Correct

```html
<input type="text" name="name">
```

### Incorrect

```html
<input type="text" id="formName">
```

---

## Security

- Do not expose your Telegram bot token in frontend code.
- Store `BOT_TOKEN` and `CHAT_ID` as Cloudflare Worker secrets.
- Use `_gotcha` to reduce spam.

---

## License

MIT
