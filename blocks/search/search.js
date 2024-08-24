import {
  createOptimizedPicture,
  decorateIcons,
  fetchPlaceholders,
} from '../../scripts/aem.js';

const searchParams = new URLSearchParams(window.location.search);

function findNextHeading(el) {
  let preceedingEl = el.parentElement.previousElement || el.parentElement.parentElement;
  let h = 'H2';
  while (preceedingEl) {
    const lastHeading = [...preceedingEl.querySelectorAll('h1, h2, h3, h4, h5, h6')].pop();
    if (lastHeading) {
      const level = parseInt(lastHeading.nodeName[1], 10);
      h = level < 6 ? `H${level + 1}` : 'H6';
      preceedingEl = false;
    } else {
      preceedingEl = preceedingEl.previousElement || preceedingEl.parentElement;
    }
  }
  return h;
}

function highlightTextElements(terms, elements) {
  elements.forEach((element) => {
    if (!element || !element.textContent) return;

    const matches = [];
    const { textContent } = element;
    terms.forEach((term) => {
      let start = 0;
      let offset = textContent.toLowerCase().indexOf(term.toLowerCase(), start);
      while (offset >= 0) {
        matches.push({ offset, term: textContent.substring(offset, offset + term.length) });
        start = offset + term.length;
        offset = textContent.toLowerCase().indexOf(term.toLowerCase(), start);
      }
    });

    if (!matches.length) {
      return;
    }

    matches.sort((a, b) => a.offset - b.offset);
    let currentIndex = 0;
    const fragment = matches.reduce((acc, { offset, term }) => {
      if (offset < currentIndex) return acc;
      const textBefore = textContent.substring(currentIndex, offset);
      if (textBefore) {
        acc.appendChild(document.createTextNode(textBefore));
      }
      const markedTerm = document.createElement('mark');
      markedTerm.textContent = term;
      acc.appendChild(markedTerm);
      currentIndex = offset + term.length;
      return acc;
    }, document.createDocumentFragment());
    const textAfter = textContent.substring(currentIndex);
    if (textAfter) {
      fragment.appendChild(document.createTextNode(textAfter));
    }
    element.innerHTML = '';
    element.appendChild(fragment);
  });
}

export async function fetchData(source) {
  const response = await fetch(source);
  if (!response.ok) {
    // eslint-disable-next-line no-console
    console.error('error loading API response', response);
    return null;
  }

  const json = await response.json();
  if (!json) {
    // eslint-disable-next-line no-console
    console.error('empty API response', source);
    return null;
  }

  return json.data;
}

function renderResult(result, searchTerms, titleTag) {
  const li = document.createElement('li');
  const a = document.createElement('div');
  // a.href = result.path;
  a.addEventListener('click', async (e) => {
    e.preventDefault();
    searchParams.set('product', result.name);
    const url = new URL(window.location.href);
    url.search = searchParams.toString();
    window.history.replaceState({}, '', url.toString());
    const { openModal } = await import(`${window.hlx.codeBasePath}/blocks/modal/modal.js`);
    await openModal("/product-details");
    let dialogElement = document.querySelector('dialog');
    dialogElement.addEventListener('close', () => {
      searchParams.delete('product');
      const url = new URL(window.location.href);
      url.search = searchParams.toString();
      window.history.replaceState({}, '', url.toString());
    });

  });

  result.image = result.image || 'https://main--aip--gargadobe.hlx.page/media_16217f65af2aa2100714b80ea9cd45d2492cdd9f7.png?width=2000&format=webply&optimize=medium';
  if (result.image) {
    const wrapper = document.createElement('div');
    wrapper.className = 'search-result-image';
    const pic = createOptimizedPicture(result.image, '', false, [{ width: '375' }]);
    wrapper.append(pic);
    a.append(wrapper);
  }
  result.title = result.name;
  if (result.title) {
    const title = document.createElement(titleTag);
    title.className = 'search-result-title';
    const link = document.createElement('a');
    link.href = result.path;
    link.textContent = result.title;
    highlightTextElements(searchTerms, [link]);
    title.append(link);
    a.append(title);
  }
  if (result.description) {
    const description = document.createElement('p');
    description.textContent = result.description;
    description.classList.add('truncate');
    highlightTextElements(searchTerms, [description]);
    a.append(description);
  }

  if (result.tags) {
    const tags = document.createElement('div');
    tags.className = 'search-result-tags';
    result.tags = result.tags.split(',');
    result.tags.forEach((tag) => {
      const tagElement = document.createElement('span');
      tagElement.className = 'tag';
      tagElement.textContent = tag;
      tagElement.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent the card click event
        event.preventDefault(); // Prevent the default anchor behavior
        searchParams.set('tag', tag);
        const url = new URL(window.location.href);
        url.search = searchParams.toString();
        window.history.replaceState({}, '', url.toString());
        const input = document.querySelector('input');
        input.dispatchEvent(new Event('input'));
      });

      tags.append(tagElement);
    });
    a.append(tags);
  }

  li.append(a);
  return li;
}

function clearSearchResults(block) {
  const searchResults = block.querySelector('.search-results');
  searchResults.innerHTML = '';
}

function clearSearch(block) {
  clearSearchResults(block);
  if (window.history.replaceState) {
    const url = new URL(window.location.href);
    url.search = '';
    searchParams.delete('q');
    window.history.replaceState({}, '', url.toString());
  }
}

async function renderResults(block, config, filteredData, searchTerms) {
  clearSearchResults(block);
  const searchResults = block.querySelector('.search-results');
  const headingTag = searchResults.dataset.h;
  if (filteredData.length) {
    searchResults.classList.remove('no-results');
    filteredData.forEach((result) => {
      const li = renderResult(result, searchTerms, headingTag);
      searchResults.append(li);
    });
  } else {
    const noResultsMessage = document.createElement('li');
    searchResults.classList.add('no-results');
    noResultsMessage.textContent = config.placeholders.searchNoResults || 'No results found.';
    searchResults.append(noResultsMessage);
  }
}

function compareFound(hit1, hit2) {
  return hit1.minIdx - hit2.minIdx;
}

function filterData(searchTerms, data) {
  const foundInHeader = [];
  const foundInMeta = [];

  data.forEach((result) => {
    let minIdx = -1;

    searchTerms.forEach((term) => {
      const idx = (result.header || result.title)?.toLowerCase()?.indexOf(term);
      if (idx < 0) return;
      if (minIdx < idx) minIdx = idx;
    });

    if (minIdx >= 0) {
      foundInHeader.push({ minIdx, result });
      return;
    }

    const metaContents = `${result.title} ${result.description} ${result?.path?.split('/')?.pop()}`?.toLowerCase();
    searchTerms.forEach((term) => {
      const idx = metaContents.indexOf(term);
      if (idx < 0) return;
      if (minIdx < idx) minIdx = idx;
    });

    if (minIdx >= 0) {
      foundInMeta.push({ minIdx, result });
    }
  });

  return [
    ...foundInHeader.sort(compareFound),
    ...foundInMeta.sort(compareFound),
  ].map((item) => item.result);
}

function addTagsFilter(block, data, selectedTag) {
  const searchFilters = block.querySelector('.search-filters');
  searchFilters.innerHTML = '';
  const tagsContainer = document.createElement('div');
  tagsContainer.className = 'tags-container';
  const tags = new Set();
  if (data) {
    data.forEach((result) => {
      if (result.tags) {
        result.tags.split(',').forEach((tag) => tags.add(tag));
      }
    });
  }
  tags.forEach((tag) => {
    const tagElement = document.createElement('span');
    tagElement.className = 'tag';
    if (tag === selectedTag) {
      tagElement.classList.add('selected');
    }
    tagElement.textContent = tag;
    tagElement.addEventListener('click', (event) => {
      event.stopPropagation(); // Prevent the card click event
      event.preventDefault(); // Prevent the default anchor behavior
      const selectedTag = searchParams.get('tag') === tag ? '' : tag;
      if (!selectedTag) {
        searchParams.delete('tag');
      } else {
        searchParams.set('tag', selectedTag);
      }
      const url = new URL(window.location.href);
      url.search = searchParams.toString();
      window.history.replaceState({}, '', url.toString());
      const input = document.querySelector('input');
      input.dispatchEvent(new Event('input'));
    });
    tagsContainer.append(tagElement);
  });
  searchFilters.append(tagsContainer);
}

async function handleSearch(e, block, config) {
  const searchValue = e.target.value;
  if (searchValue.length < 3) {
    searchParams.delete('q');
  } else {
    searchParams.set('q', searchValue);
  }
  if (window.history.replaceState) {
    const url = new URL(window.location.href);
    url.search = searchParams.toString();
    window.history.replaceState({}, '', url.toString());
  }
  const selectedTag = searchParams.get('tag') || '';
  const searchTerms = searchValue.toLowerCase().split(/\s+/).filter((term) => !!term);
  let data = await fetchData(config.source);
  addTagsFilter(block, data, selectedTag);
  if (selectedTag) {
    data = data.filter((result) => result.tags?.split(',').includes(selectedTag));
  }
  if (searchValue.length < 3) {
    renderResults(block, config, data, searchTerms);
    // clearSearch(block);
    return;
  }
  const filteredData = filterData(searchTerms, data);
  await renderResults(block, config, filteredData, searchTerms);
}

function searchResultsContainer(block) {
  const results = document.createElement('ul');
  results.className = 'search-results';
  results.dataset.h = findNextHeading(block);
  return results;
}

function searchFilters(block) {
  const results = document.createElement('div');
  results.className = 'search-filters';
  return results;
}


function searchInput(block, config) {
  const input = document.createElement('input');
  input.setAttribute('type', 'search');
  input.className = 'search-input';

  const searchPlaceholder = config.placeholders.searchPlaceholder || 'Search...';
  input.placeholder = searchPlaceholder;
  input.setAttribute('aria-label', searchPlaceholder);

  input.addEventListener('input', (e) => {
    handleSearch(e, block, config);
  });

  input.addEventListener('keyup', (e) => { if (e.code === 'Escape') { clearSearch(block); } });

  return input;
}

function searchIcon() {
  const icon = document.createElement('span');
  icon.classList.add('icon', 'icon-search');
  return icon;
}

function searchBox(block, config) {
  const box = document.createElement('div');
  box.classList.add('search-box');
  box.append(
    searchIcon(),
    searchInput(block, config),
  );

  return box;
}

export default async function decorate(block) {
  const placeholders = await fetchPlaceholders();
  const source = block.querySelector('a[href]') ? block.querySelector('a[href]').href : '/query-index.json';
  block.innerHTML = '';
  block.append(
    searchBox(block, { source, placeholders }),
    searchFilters(block),
    searchResultsContainer(block),
  );

  const input = block.querySelector('input');
  input.value = searchParams.get('q');
  input.dispatchEvent(new Event('input'));

  decorateIcons(block);
}
