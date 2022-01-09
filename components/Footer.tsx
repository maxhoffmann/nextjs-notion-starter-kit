import * as React from "react";
import * as config from "lib/config";

import styles from "./styles.module.css";

export const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.copyright}>Copyright 2021 {config.author}</div>
    </footer>
  );
};
