# Flirty Friend Chat

**Project:** A chat app with streaming LLM (GPT-4o-mini) and a message moderation system..  

---

## 🌐 Demo

- **Online on Vercel:** [https://flirty-friend-chat.vercel.app/chat]
- **GitHub Repository:** [https://github.com/MarkiMark01/flirty-friend-chat] 

---

## Technologies & Stack

- **Frontend**: Next.js (App Router), Tailwind CSS
- **Backend:** Next.js API Routes
- **LLM:** OpenAI GPT-4o-mini
- **Moderation:** Banned word pairs with support for obfuscation, leet, and repeated letters
- **Streaming:** HTTP streaming via ReadableStream
- **Docker:** Project is containerized for quick setup

---

## How to Run

### Locally

1. Clone the repository:

```bash
git clone <repo_url>
cd flirty-chat
```
2. Create a .env file with your OpenAI key:

OPENAI_API_KEY=your_openai_api_key_here

3. Install dependencies and start Next.js:

```bash
npm install
npm run dev
```

Docker


1. Build the Docker image:

```bash
docker build -t flirty-chat .
```

2. Run the container:

```bash
docker run -p 3001:3000 --env-file .env flirty-chat

```

### Possible Improvements With More Time

1. Write unit tests for moderation and rate limiting

2. Improve styling and responsive design for all mobile devices

3. Add chat history storage in a database

4. Consider using WebSocket for smoother streaming