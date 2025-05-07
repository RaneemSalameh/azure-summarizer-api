# Azure Summarizer API

A minimal, secure forwarding API that wraps Azure AI’s Summarize Content service.  
It accepts raw text and returns concise, human-readable summaries. This documentation is written so that **business users**, **developers**, and **architects** alike can understand, adopt, and integrate the API.

---

## Table of Contents

1. [Overview](#overview)  
2. [System Design & Architecture](#system-design--architecture)  
3. [Prerequisites](#prerequisites)  
4. [Installation](#installation)  
5. [Configuration](#configuration)  
6. [Running Locally](#running-locally)  
7. [Usage Examples](#usage-examples)  
8. [API Reference](#api-reference)  
9. [Data Validation & Sanitization](#data-validation--sanitization)  
10. [Error Handling](#error-handling)  
11. [Deployment & Uptime](#deployment--uptime)  
12. [Security Considerations](#security-considerations)  
13. [Cleanup](#cleanup)  
14. [Documentation Guidelines & Credits](#documentation-guidelines--credits)  

---

## Overview

The **Azure Summarizer API** exposes a single endpoint:

- **`POST /summarize`**:  
  - Accepts a JSON payload with a `"text"` field.  
  - Forwards it to Azure AI’s Summarize Content feature as a long-running job.  
  - Polls Azure until the job completes and returns a concise summary.

**Why use this API?**  
- **No vendor signup required**: your teams simply call your unified interface.  
- **Multi-platform**: works from JavaScript, Python, Postman, business dashboards.  
- **Production-ready**: built-in validation, structured polling, process management with PM2.

---

## System Design & Architecture

1. **Express.js server**  
   - Single route (`/summarize`) handles incoming requests.  
   - Uses `dotenv` to load configuration from `.env`.

2. **Azure Summarization**  
   - Leverages Azure AI “Analyze Text” LRO endpoint (`/language/analyze-text/jobs`).  
   - Submits `ExtractiveSummarization` tasks and polls via the `Operation-Location` header.

3. **Process Management**  
   - **PM2** keeps the Node.js process alive and auto-restarts on crashes or server reboots.


![Architecture Diagram](docs/architecture.png)  
*Figure: Request flow from client → your API → Azure → response.*

---

## Prerequisites

- **Node.js** v16+ and **npm**  
- **Git**  
- **Azure Subscription** with a **Language** (Text Analytics) resource on Free tier (F0)  
- **DigitalOcean Droplet** (Ubuntu 22.04+), or equivalent VPS  
- SSH access set up for deployment  

---

## Installation

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/azure-summarizer-api.git
cd azure-summarizer-api

# 2. Install dependencies
npm install


< Configuration >

#1. Create .env file
In the project root, create a file named .env:

#2. include in the file:
AZURE_ENDPOINT=https://<your-resource>.cognitiveservices.azure.com
AZURE_KEY=<your-key>
PORT=<PORT>

#3. .env in .gitignore
Do not commit .env—it’s in .gitignore.

#4. How to obtain resource and key from Azure Portal 
Obtain <your-resource> and <your-key> under Azure Portal → Keys and Endpoint of your Language resource.



< Running Locally >

#1. Type the following command where your project is located 
node index.js

#2. This must be returned 
Server listens on http://localhost:3000 by default (or your PORT).


< Usage Examples > 

#1. Paste the following in a new local terminal 
curl -X POST http://localhost:3000/summarize \
  -H "Content-Type: application/json" \
  -d '{"text":"Enter a long paragraph to summarize here."}'

  #2. This Sample Response should return 
{
  "summary": "A concise summary of your paragraph."
}

<You can also run it in postman>

#1. Navigate to Postman and input the following 

Method: POST
URL: http://localhost:3000/summarize

Headers:
Key	Value
Content-Type	application/json

Body (raw, JSON):
{ "text": "Your long document text goes here." }
Send and view the JSON summary.



<API Reference: Postman>

POST /summarize

#1. Input the following 
Headers:
Content-Type: application/json

#2: Input the following
Request Body:
{
  "text": "Your full document text goes here."
}

#3: Indication of success response

Successful Response (200):
{
  "summary": "Concise summary text."
}

Long-Running Job Flow:

1. Submit job → 202 + Operation-Location header
2. Poll until status === "succeeded"
3. Return extracted sentences


<Data Validation & Sanitization>

- Type check: ensures text exists and is a string.
- Length limit: Azure supports up to ~5 000 characters per document—longer inputs are truncated or rejected.
- Encoding: all communication uses UTF-8 JSON.


<Error Handling>

Status	                   Condition	                            Response
400	                       Missing or non-string text	            { "error": "Request must include a string \"text\" field." }
500                        Azure API failure or timeout	            { "error": "Summarization failed.", "details": <error info> }



<Deployment & Uptime>

Process Management with PM2

#1. When you ssh into your Droplet type the following
npm install -g pm2
cd ~/azure-summarizer-api
npm install

pm2 start index.js --name summarizer
pm2 startup       # follow the printed command
pm2 save

#Verify auto-start after reboot:
pm2 status

