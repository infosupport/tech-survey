export default function renderNotFoundPage() {
    return (
        <>
            <style>{`
          body {
            margin: 0;
          }
          .next-error-h1 {
            border-right: 1px solid rgba(0, 0, 0, 0.3);
            color: #000; /* Default text color */
          }
        `}</style>
            <h1
                className="next-error-h1 dark:border-white dark:text-white"
                style={{
                    display: "inline-block",
                    margin: "0px 20px 0px 0px",
                    padding: "0px 23px 0px 0px",
                    fontSize: "24px",
                    fontWeight: 500,
                    verticalAlign: "top",
                    lineHeight: "49px",
                }}
            >
                404
            </h1>
            <div style={{ display: "inline-block" }}>
                <h2
                    style={{
                        fontSize: "14px",
                        fontWeight: 400,
                        lineHeight: "49px",
                        margin: "0px",
                    }}
                    className="dark:text-white"
                >
                    This page could not be found.
                </h2>
            </div>
        </>
    );
}
