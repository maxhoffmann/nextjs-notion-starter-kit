import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import cs from "classnames";
import { useRouter } from "next/router";
import { PageBlock } from "notion-types";

import { Tweet, TwitterContextProvider } from "react-static-tweets";

import {
  NotionRenderer,
  Code,
  Collection,
  CollectionRow,
} from "react-notion-x";

import { getBlockTitle } from "notion-utils";
import { mapPageUrl, getCanonicalPageUrl } from "lib/map-page-url";
import { mapNotionImageUrl } from "lib/map-image-url";
import { getPageDescription } from "lib/get-page-description";
import * as types from "lib/types";
import * as config from "lib/config";

// components
import { Loading } from "./Loading";
import { Page404 } from "./Page404";
import { PageHead } from "./PageHead";
import { Footer } from "./Footer";

import styles from "./styles.module.css";

const Equation = dynamic(() =>
  import("react-notion-x").then((notion) => notion.Equation)
);

const Modal = dynamic(
  () => import("react-notion-x").then((notion) => notion.Modal),
  { ssr: false }
);

export const NotionPage: React.FC<types.PageProps> = ({
  site,
  recordMap,
  error,
  pageId,
}) => {
  const router = useRouter();
  const params: any = {};
  const searchParams = new URLSearchParams(params);

  if (router.isFallback) {
    return <Loading />;
  }

  const keys = Object.keys(recordMap?.block || {});
  const block = recordMap?.block?.[keys[0]]?.value;

  if (error || !site || !keys.length || !block) {
    return <Page404 site={site} pageId={pageId} error={error} />;
  }

  const title = getBlockTitle(block, recordMap) || site.name;

  if (!config.isServer) {
    // add important objects to the window global for easy debugging
    const g = window as any;
    g.pageId = pageId;
    g.recordMap = recordMap;
    g.block = block;
  }

  const siteMapPageUrl = mapPageUrl(site, recordMap, searchParams);

  const canonicalPageUrl =
    !config.isDev && getCanonicalPageUrl(site, recordMap)(pageId);

  const socialImage = mapNotionImageUrl(
    (block as PageBlock).format?.page_cover || config.defaultPageCover,
    block
  );

  const socialDescription =
    getPageDescription(block, recordMap) ?? config.description;

  return (
    <TwitterContextProvider
      value={{
        tweetAstMap: (recordMap as any).tweetAstMap || {},
        swrOptions: {
          fetcher: (id) =>
            fetch(`/api/get-tweet-ast/${id}`).then((r) => r.json()),
        },
      }}
    >
      <PageHead site={site} />

      <Head>
        <meta property="og:title" content={title} />
        <meta property="og:site_name" content={site.name} />

        <meta name="twitter:title" content={title} />
        <meta property="twitter:domain" content={site.domain} />

        {config.twitter && (
          <meta name="twitter:creator" content={`@${config.twitter}`} />
        )}

        {socialDescription && (
          <>
            <meta name="description" content={socialDescription} />
            <meta property="og:description" content={socialDescription} />
            <meta name="twitter:description" content={socialDescription} />
          </>
        )}

        {socialImage ? (
          <>
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:image" content={socialImage} />
            <meta property="og:image" content={socialImage} />
          </>
        ) : (
          <meta name="twitter:card" content="summary" />
        )}

        {canonicalPageUrl && (
          <>
            <link rel="canonical" href={canonicalPageUrl} />
            <meta property="og:url" content={canonicalPageUrl} />
            <meta property="twitter:url" content={canonicalPageUrl} />
          </>
        )}

        <title>{title}</title>
      </Head>

      <NotionRenderer
        bodyClassName={cs(
          styles.notion,
          pageId === site.rootNotionPageId && "index-page"
        )}
        components={{
          pageLink: ({
            href,
            as,
            passHref,
            prefetch,
            replace,
            scroll,
            shallow,
            locale,
            ...props
          }) => (
            <Link
              href={href}
              as={as}
              passHref={passHref}
              prefetch={prefetch}
              replace={replace}
              scroll={scroll}
              shallow={shallow}
              locale={locale}
            >
              <a {...props} />
            </Link>
          ),
          code: Code,
          collection: Collection,
          collectionRow: CollectionRow,
          tweet: Tweet,
          modal: Modal,
          equation: Equation,
        }}
        recordMap={recordMap}
        fullPage={true}
        rootPageId={site.rootNotionPageId}
        showCollectionViewDropdown={false}
        mapPageUrl={siteMapPageUrl}
        mapImageUrl={mapNotionImageUrl}
        footer={<Footer />}
      />
    </TwitterContextProvider>
  );
};
