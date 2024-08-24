const searchParams = new URLSearchParams(window.location.search);

const DEFAULT_IMAGE = 'https://main--aip--gargadobe.hlx.page/media_16217f65af2aa2100714b80ea9cd45d2492cdd9f7.png?width=2000&format=webply&optimize=medium';

function productNotFound() {
  const h1 = document.createElement('h1');
  h1.textContent = 'Product not found';
  return h1;
}

async function fetchProductDetails(sourceUrl) {
  // fetch the product details
  const response = await fetch(sourceUrl);
  const products = await response.json();
  return products.data;
}

function createImage(src, alt) {
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  img.style.borderRadius = '50%'; // make the image round
  return img;
}

function createTitle(text) {
  const title = document.createElement('h2');
  title.textContent = text;
  return title;
}

function createDescription(text) {
  const description = document.createElement('p');
  description.textContent = text;
  return description;
}

function createLink(href, text) {
  const link = document.createElement('a');
  link.href = href;
  link.textContent = text;
  link.target = '_blank';
  return link;
}

function createTags(tagStr) {
  const tagsArray = tagStr.split(',');
  const tags = document.createElement('div');
  tags.classList.add('tags');
  tagsArray.forEach((tag) => {
    const span = document.createElement('span');
    span.classList.add('tag');
    span.textContent = tag;
    tags.appendChild(span);
  });
  return tags;
}

export default async function decorate(block) {
  const source = block.querySelector('a[href]') ? block.querySelector('a[href]').href : '/query-index.json';
  block.innerHTML = '';
  const productsData = await fetchProductDetails(source);

  // get the selected product from searchparams
  const selectedProduct = searchParams.get('product');
  const product = await productsData.find((product) => product.name === selectedProduct);
  if (!product) {
    block.replaceWith(productNotFound());
    return;
  }

  // create the product details
  const productDetails = document.createElement('div');
  productDetails.classList.add('product-details');

  // create and append elements using helper functions
  const productImage = createImage(product.image || DEFAULT_IMAGE, product.name);
  productDetails.appendChild(productImage);

  const productTitle = createTitle(product.name);
  productDetails.appendChild(productTitle);

  const productDescription = createDescription(product.description);
  productDetails.appendChild(productDescription);

  const slackLink = createLink(product.slack, 'Slack');
  productDetails.appendChild(slackLink);

  const wikiLink = createLink(product.wiki, 'Wiki');
  productDetails.appendChild(wikiLink);

  const jiraLink = createLink(product.jira, 'Jira');
  productDetails.appendChild(jiraLink);

  const tags = createTags(product.tags);
  productDetails.appendChild(tags);

  block.replaceWith(productDetails);
}