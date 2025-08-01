import React, { useState } from "react";
import PrivacyPolicyModal from "./PrivacyPolicyModal";

const ShowPrivacyPolicyButton = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        전문보기
      </button>
      <PrivacyPolicyModal open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default ShowPrivacyPolicyButton; 