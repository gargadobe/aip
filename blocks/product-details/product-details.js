import { decorateIcons } from "../../scripts/aem.js";


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
  img.classList.add('product-image');
  img.src = src;
  img.alt = alt;
  return img;
}

function createTitle(text) {
  const title = document.createElement('h2');
  title.textContent = text;
  return title;
}

function createDescription(text) {
  const description = document.createElement('p');
  description.classList.add('product-description');
  description.innerHTML = text;
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

function icon( name) {
  const icon = document.createElement('span');
  icon.classList.add('icon', `icon-${name}`);
  return icon;
}

export default async function decorate(block) {
  const source = block.querySelector('a[href]') ? block.querySelector('a[href]').href : '/query-index.json';
  block.innerHTML = '';
  const productsData = await fetchProductDetails(source);

  const searchParams = new URLSearchParams(window.location.search);
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

  const productHeader = document.createElement('div');
  productHeader.classList.add('product-header');
  const productImage = createImage(product.image || DEFAULT_IMAGE, product.name);
  const productTitle = createTitle(product.name);
  productHeader.appendChild(productImage);
  productHeader.appendChild(productTitle);
  productDetails.appendChild(productHeader);

  const productDescription = createDescription(product.description);
  productDetails.appendChild(productDescription);

  const productDetailsFooter = document.createElement('div');

  const referenceContainer = document.createElement('div');
  referenceContainer.classList.add('references-container');
  referenceContainer.appendChild(icon('slack'));
  referenceContainer.appendChild(icon('confluence'));
  referenceContainer.appendChild(icon('github'));
  productDetailsFooter.appendChild(referenceContainer);

  decorateIcons(productDetailsFooter);
  productDetails.appendChild(productDetailsFooter);

  block.replaceWith(productDetails);
}