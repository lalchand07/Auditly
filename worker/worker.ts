import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Set up __dirname for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from the root .env.local file
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })

import { createClient } from '@supabase/supabase-js'
import { chromium } from 'playwright'
// We will use the lighthouse CLI module programmatically
import lighthouse from 'lighthouse'
import { URL } from 'url'

// Environment variables
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase environment variables are not set.')
}

// Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// A simple delay function
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * The main function to process pending scan jobs.
 */
async function processJobs() {
  console.log('Checking for pending jobs...')

  // 1. Fetch a pending job
  const { data: job, error } = await supabase
    .from('scan_jobs')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') { // 'PGRST116' means no rows found, which is normal
      console.error('Error fetching job:', error)
    }
    return // Wait for the next poll
  }

  if (!job) {
    console.log('No pending jobs found.')
    return
  }

  console.log(`Processing job ${job.id} for URL: ${job.url}`)

  // Update job status to 'running'
  await supabase
    .from('scan_jobs')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', job.id)

  try {
    // Here we will orchestrate the scan
    const summary = await runScan(job.url)

    // Generate and upload the PDF report
    const pdfUrl = await generateAndUploadPdf(job, summary);

    // Update job to 'done' with summary and PDF URL
    await supabase
      .from('scan_jobs')
      .update({
        status: 'done',
        finished_at: new Date().toISOString(),
        summary_json: summary,
        pdf_url: pdfUrl,
      })
      .eq('id', job.id)

    console.log(`Job ${job.id} completed successfully.`)
  } catch (e: any) {
    console.error(`Failed to process job ${job.id}:`, e)
    // Update job to 'failed'
    await supabase
      .from('scan_jobs')
      .update({
        status: 'failed',
        finished_at: new Date().toISOString(),
        summary_json: { error: e.message },
      })
      .eq('id', job.id)
  }
}

/**
 * Runs the full scan for a given URL.
 * @param url The URL to scan.
 */
async function runScan(url: string) {
  // Launch browser with a remote debugging port
  const port = 9222;
  const browser = await chromium.launch({ args: [`--remote-debugging-port=${port}`] });
  const page = await browser.newPage();
  const summary: any = {};

  try {
    // Run all scans
    summary.lighthouse = await runLighthouse(url, port);
    summary.headers = await checkHeaders(url, page);
    summary.seo = await runSeoChecks(page);
    summary.techStack = await detectTechStack(page);
    summary.brokenLinks = await checkBrokenLinks(page, url);
  } finally {
    await browser.close();
  }

  return summary;
}

/**
 * Runs Lighthouse audit on a URL.
 * @param url The URL to audit.
 * @param port The debugging port of the browser.
 */
async function runLighthouse(url: string, port: number) {
  console.log(`Running Lighthouse for ${url}...`);

  // The 'lighthouse' function returns a promise that resolves with the lighthouse results object.
  const { lhr } = await lighthouse(url, {
    port,
    output: 'json',
    logLevel: 'info',
    onlyCategories: ['performance', 'seo', 'best-practices', 'accessibility'],
  });

  // Extract the scores we care about
  return {
    performance: Math.round(lhr.categories.performance.score * 100),
    seo: Math.round(lhr.categories.seo.score * 100),
    bestPractices: Math.round(lhr.categories['best-practices'].score * 100),
    accessibility: Math.round(lhr.categories.accessibility.score * 100),
  };
}

/**
 * Checks for security headers in the response.
 * @param url The URL to check.
 * @param page A Playwright page object.
 */
async function checkHeaders(url: string, page: any) {
  console.log(`Checking headers for ${url}...`)
  const response = await page.goto(url)
  const headers = response?.headers() || {}

  return {
    'content-security-policy': headers['content-security-policy'] || null,
    'strict-transport-security': headers['strict-transport-security'] || null,
    'x-frame-options': headers['x-frame-options'] || null,
    'x-content-type-options': headers['x-content-type-options'] || null,
  }
}


/**
 * Main worker loop.
 */
async function main() {
  console.log('Worker started.')
  while (true) {
    await processJobs()
    // Wait for 10 seconds before checking for new jobs
    await sleep(10000)
  }
}

/**
 * Performs basic SEO checks on the page.
 * @param page A Playwright page object.
 */
async function runSeoChecks(page: any) {
  console.log('Running SEO checks...');
  const title = await page.title();
  const description = await page.locator('meta[name="description"]').getAttribute('content');
  const h1s = await page.locator('h1').allTextContents();

  return {
    title: {
      text: title,
      length: title.length,
    },
    metaDescription: {
      text: description || null,
      length: description?.length || 0,
    },
    h1Tags: {
      count: h1s.length,
      tags: h1s,
    },
  };
}

/**
 * Detects the technology stack of the website.
 * @param page A Playwright page object.
 */
async function detectTechStack(page: any) {
  console.log('Detecting tech stack...');
  const detected: string[] = [];

  // Check for Next.js
  if (await page.locator('#__next').count() > 0) {
    detected.push('Next.js');
  }
  // Check for React
  const hasReact = await page.evaluate(() => !!(window as any).React || !!document.querySelector('[data-reactroot]'));
  if (hasReact && !detected.includes('Next.js')) {
    detected.push('React');
  }
  // Check for WordPress
  const hasWordPress = await page.locator('meta[name="generator"][content*="WordPress"]').count() > 0;
  if (hasWordPress) {
    detected.push('WordPress');
  }
  // Check for Shopify
  const hasShopify = await page.evaluate(() => (window as any).Shopify?.shop);
  if (hasShopify) {
    detected.push('Shopify');
  }

  return detected;
}

/**
 * Checks for broken links on the page.
 * @param page A Playwright page object.
 * @param baseUrl The base URL of the page being scanned.
 */
async function checkBrokenLinks(page: any, baseUrl: string) {
  console.log('Checking for broken links...');
  const links = await page.locator('a[href]').all();
  const pageUrl = new URL(baseUrl);
  const internalLinks = new Set<string>();

  for (const link of links) {
    const href = await link.getAttribute('href');
    if (!href) continue;

    try {
      const absoluteUrl = new URL(href, pageUrl.origin).toString();
      if (absoluteUrl.startsWith(pageUrl.origin)) {
        internalLinks.add(absoluteUrl);
      }
    } catch (e) {
      // Invalid URL, ignore
    }
  }

  const brokenLinks: { url: string; status: number }[] = [];
  for (const link of internalLinks) {
    try {
      const response = await page.context().request.head(link);
      if (response.status() >= 400) {
        brokenLinks.push({ url: link, status: response.status() });
      }
    } catch (e) {
      // Could be a network error, etc. For this MVP, we'll consider it broken.
      brokenLinks.push({ url: link, status: 500 }); // Generic server error status
    }
  }

  return {
    count: brokenLinks.length,
    links: brokenLinks,
  };
}


/**
 * Generates an HTML report from the scan summary.
 * @param job The scan job object.
 * @param summary The summary object from the scan.
 * @returns An HTML string.
 */
function createReportHtml(job: any, summary: any) {
  // A basic, self-contained HTML report with inline CSS
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Scan Report for ${job.url}</title>
      <style>
        body { font-family: sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 800px; margin: 2rem auto; padding: 1rem; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0,0,0,0.05); }
        h1, h2 { color: #1a1a1a; }
        h1 { font-size: 1.5rem; }
        h2 { font-size: 1.2rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; margin-top: 2rem; }
        .score { font-size: 2rem; font-weight: bold; }
        .score-card { text-align: center; padding: 1rem; border-radius: 8px; color: white; }
        .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
        .bg-green { background-color: #28a745; }
        .bg-orange { background-color: #fd7e14; }
        .bg-red { background-color: #dc3545; }
        ul { padding-left: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Scan Report</h1>
        <p><strong>URL:</strong> ${job.url}</p>
        <p><strong>Scanned at:</strong> ${new Date(job.started_at).toLocaleString()}</p>

        <h2>Lighthouse Summary</h2>
        <div class="grid">
          <div class="score-card ${summary.lighthouse.performance > 89 ? 'bg-green' : summary.lighthouse.performance > 49 ? 'bg-orange' : 'bg-red'}">
            <div>Performance</div>
            <div class="score">${summary.lighthouse.performance}</div>
          </div>
          <div class="score-card ${summary.lighthouse.seo > 89 ? 'bg-green' : summary.lighthouse.seo > 49 ? 'bg-orange' : 'bg-red'}">
            <div>SEO</div>
            <div class="score">${summary.lighthouse.seo}</div>
          </div>
          <div class="score-card ${summary.lighthouse.bestPractices > 89 ? 'bg-green' : summary.lighthouse.bestPractices > 49 ? 'bg-orange' : 'bg-red'}">
            <div>Best Practices</div>
            <div class="score">${summary.lighthouse.bestPractices}</div>
          </div>
          <div class="score-card ${summary.lighthouse.accessibility > 89 ? 'bg-green' : summary.lighthouse.accessibility > 49 ? 'bg-orange' : 'bg-red'}">
            <div>Accessibility</div>
            <div class="score">${summary.lighthouse.accessibility}</div>
          </div>
        </div>

        <h2>Security Headers</h2>
        <ul>
          ${Object.entries(summary.headers).map(([key, value]) => `<li><strong>${key}:</strong> ${value || 'Not set'}</li>`).join('')}
        </ul>

        <h2>SEO Checks</h2>
        <ul>
            <li><strong>Title:</strong> ${summary.seo.title.text} (${summary.seo.title.length} chars)</li>
            <li><strong>Meta Description:</strong> ${summary.seo.metaDescription.text || 'Not set'} (${summary.seo.metaDescription.length} chars)</li>
            <li><strong>H1 Tags:</strong> ${summary.seo.h1Tags.count} found</li>
        </ul>

        <h2>Technology Stack</h2>
        <ul>
          ${summary.techStack.map((tech: string) => `<li>${tech}</li>`).join('')}
        </ul>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generates a PDF report and uploads it to Supabase storage.
 * @param job The job object.
 * @param summary The scan summary.
 * @returns The public URL of the uploaded PDF.
 */
async function generateAndUploadPdf(job: any, summary: any): Promise<string> {
  console.log('Generating PDF report...');
  const htmlContent = createReportHtml(job, summary);
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.setContent(htmlContent, { waitUntil: 'networkidle' });
  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });

  await browser.close();

  const filePath = `${job.workspace_id}/${job.id}.pdf`;
  console.log(`Uploading PDF to storage at: ${filePath}`);

  const { error: uploadError } = await supabase.storage
    .from('reports')
    .upload(filePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true, // Overwrite if it already exists
    });

  if (uploadError) {
    throw new Error(`Failed to upload PDF: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('reports')
    .getPublicUrl(filePath);

  if (!publicUrlData) {
    throw new Error('Failed to get public URL for the PDF.');
  }

  console.log(`PDF uploaded successfully. URL: ${publicUrlData.publicUrl}`);
  return publicUrlData.publicUrl;
}


main().catch((e) => {
  console.error('Worker crashed:', e)
  process.exit(1)
})
