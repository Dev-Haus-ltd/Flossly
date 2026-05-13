const APIURL = "/api";
const UPGRADE_EVENT_CODES = new Set(['UPGRADE_REQUIRED', 'FEATURE_NOT_AVAILABLE', 'LIMIT_REACHED']);

const dispatchUpgradeRequired = (data) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('upgrade-required', {
      detail: {
        feature: data?.feature || data?.resource || 'upgrade',
        code: data?.code,
        resource: data?.resource,
      },
    }))
  }
}

export const Get = async (url) => {
  const args = {
    method: "GET",
  };
  const response = await fetch(APIURL + url  , args)
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 403 && UPGRADE_EVENT_CODES.has(data?.data?.code)) {
      dispatchUpgradeRequired(data?.data)
    }
    throw data;
  }
  return data;
};
export const Post = async (url, body) => {
  const args = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
  const response = await fetch(APIURL + url, args);
  const data = await response.json();

  if (!response.ok) {
    if (response.status === 403 && UPGRADE_EVENT_CODES.has(data?.data?.code)) {
      dispatchUpgradeRequired(data?.data)
    }
    throw data;
  }

  return data;
};

export const Delete = async (url, itemId) => {
  const args = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({id:itemId}),
  };
  const response = await fetch(APIURL + url, args);
  return response.json();
};

export const PostFormData = (url, body, onProgress) => {
  if (!onProgress) {
    return fetch(APIURL + url, {
      method: "POST",
      body,
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) {
        throw data;
      }
      return data;
    });
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", APIURL + url);

    if (xhr.upload && typeof onProgress === "function") {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText || "{}");
        resolve(data);
      } catch (err) {
        resolve({ error: true, message: "Invalid server response" });
      }
    };

    xhr.onerror = () => reject(new Error("Network error while uploading"));
    xhr.send(body);
  });
};
