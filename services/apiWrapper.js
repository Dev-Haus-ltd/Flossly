const APIURL = "/api";

export const Get = async (url) => {
  const args = {
    method: "GET",
  };
  const response = await fetch(APIURL + url  , args)
  return response.json()
};
export const Post = async (url, body) => {
  const args = {
    method: "POST",
        body: JSON.stringify(body),
  };
  const response = await fetch(APIURL + url, args);
  const data = await response.json();
  
  if (!response.ok) {
    throw data;
  }
  
  return data;
};
// 
export const Delete = async (url, itemId) => {
  const args = {
    method: "POST",
    body: JSON.stringify({id:itemId}),
  };
  const response = await fetch(APIURL + url, args);
  return response.json();
};
// post form data using fetch
export const PostFormData = async (url, body) => {
  const args = {
    method: "POST",
    body: body,
  };
  const response = await fetch(APIURL + url, args);
  return response.json();
};