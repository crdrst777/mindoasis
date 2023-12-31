import { useEffect, useState } from "react";

const useElement = (id: string) => {
  const [element, setElement] = useState<Element | null>(null);

  useEffect(() => {
    setElement(document.querySelector(`#${id}`));
  }, []);

  return element;
};

export default useElement;
