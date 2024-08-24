const searchParams = new URLSearchParams(window.location.search);

export default async function decorate(block) {
  const source = block.querySelector('a[href]') ? block.querySelector('a[href]').href : '/query-index.json';
  block.innerHTML = '';

  // get the selected product from searchparams
  const selectedProduct = searchParams.get('product');

  // fetch the product details
  const response = await fetch(source);
  const products = await response.json();
  const productsData = products.data;
  const product = await productsData.find((product) => product.name === selectedProduct);
  if (!product) {
    block.innerHTML = '<h1>Product not found</h1>';
    return;
  }
  // create the product details
  const productDetails = document.createElement('div');
  productDetails.classList.add('product-details');
  product.image = product.image || 'https://main--aip--gargadobe.hlx.page/media_16217f65af2aa2100714b80ea9cd45d2492cdd9f7.png?width=2000&format=webply&optimize=medium';
  product.tags = product.tags.split(',').map((tag) => tag.trim());
  productDetails.innerHTML = `
    <h1>${product.name}</h1>
    <img src="${product.image}" alt="${product.name}">
    <p>${product.description}</p>
  `;
  if (product.tags.length) {
    const tags = document.createElement('div');
    tags.classList.add('tags');
    product.tags.forEach((tag) => {
      const span = document.createElement('span');
      span.classList.add('tag');
      span.textContent = tag;
      tags.appendChild(span);
    });
    productDetails.appendChild(tags);
  }

  block.appendChild(productDetails);
}
