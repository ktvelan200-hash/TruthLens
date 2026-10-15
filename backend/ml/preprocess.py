"""
TruthLens – ML Data Preprocessing
Loads Fake.csv / True.csv, cleans them, and saves a unified dataset.

Usage:
    python -m ml.preprocess
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
import pandas as pd
from pathlib import Path

from app.services.nlp_service import clean_text, combine_headline_content

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
logger = logging.getLogger(__name__)

DATA_DIR   = Path(__file__).parent.parent / "data"
OUTPUT_CSV = DATA_DIR / "processed_dataset.csv"


def load_datasets() -> pd.DataFrame:
    """
    Load Fake.csv and True.csv from the data/ directory.
    Expected columns: title, text, subject, date
    Returns a combined DataFrame with a 'label' column (0=FAKE, 1=REAL).
    """
    fake_path = DATA_DIR / "Fake.csv"
    true_path = DATA_DIR / "True.csv"

    if not fake_path.exists() or not true_path.exists():
        logger.warning(
            "Dataset files not found in %s.\n"
            "Please download from Kaggle (Fake and real news dataset) and place:\n"
            "  data/Fake.csv\n"
            "  data/True.csv\n"
            "Falling back to built-in sample data for demonstration.",
            DATA_DIR,
        )
        return _build_sample_dataset()

    logger.info("Loading Fake.csv ...")
    df_fake = pd.read_csv(fake_path)
    df_fake["label"] = 0

    logger.info("Loading True.csv ...")
    df_true = pd.read_csv(true_path)
    df_true["label"] = 1

    df = pd.concat([df_fake, df_true], ignore_index=True)
    logger.info("Combined dataset: %d rows", len(df))
    return df


def _build_sample_dataset() -> pd.DataFrame:
    """
    Minimal sample dataset so the training pipeline works even without the
    full Kaggle CSVs.  Replace with real data for a production model.
    """
    samples = [
        # FAKE articles (label=0)
        {"title": "BREAKING: Secret government mind-control program exposed by whistleblower",
         "text": "Anonymous sources reveal that the deep state has been running a secret program "
                 "to control citizens through 5G towers and fluoride in drinking water. "
                 "The mainstream media is suppressing this story. Share before it's deleted! "
                 "Documents show Obama personally authorized the program in 2012.",
         "label": 0},
        {"title": "Miracle cure doctors don't want you to know about",
         "text": "Big pharma has been hiding a simple home remedy that cures cancer diabetes "
                 "and heart disease. They suppress this because it would destroy their profits. "
                 "One weird trick discovered by a local mom is going viral. "
                 "Scientists hate this! Click now before the government takes this down.",
         "label": 0},
        {"title": "SHOCK REPORT: Famous celebrity secretly works for the illuminati",
         "text": "Sources close to the celebrity confirm they attend secret meetings in "
                 "underground bunkers. Their hand gestures at award shows are coded messages "
                 "to fellow illuminati members. Hollywood is controlled by a satanic cult "
                 "that sacrifices children. Wake up sheeple, do your own research!",
         "label": 0},
        {"title": "NASA confirms flat earth theory after leaked documents surface",
         "text": "Internal NASA emails obtained by independent researchers prove that the "
                 "earth is actually flat and the space program is entirely fabricated. "
                 "Astronauts are paid actors filmed in underwater tanks. "
                 "The moon landing was directed by Stanley Kubrick. "
                 "This is the biggest cover-up in human history.",
         "label": 0},
        {"title": "Voter fraud on massive scale discovered in all swing states",
         "text": "Millions of fake ballots printed in China were shipped to battleground states "
                 "where they were used to steal the election. Dead people voted in record numbers. "
                 "Dominion voting machines were connected to servers in Venezuela. "
                 "Statistical analysis proves it was mathematically impossible for Biden to win.",
         "label": 0},
        {"title": "George Soros secretly funds antifa cell network across 50 states",
         "text": "Leaked bank records show direct wire transfers from Soros foundation "
                 "to antifa chapters in every major city. The globalist billionaire is "
                 "orchestrating a communist revolution to destroy American values. "
                 "Patriots must rise up and defend their freedoms from this coordinated attack.",
         "label": 0},
        {"title": "COVID vaccine contains microchips for government tracking program",
         "text": "Nanotechnology expert reveals that every COVID-19 vaccine dose contains "
                 "microscopic tracking devices that link to 5G towers. Bill Gates designed "
                 "the chips to monitor and control the global population. "
                 "Thousands of people have already reported magnetic symptoms proving the chips.",
         "label": 0},
        {"title": "Hillary Clinton arrested at Gitmo following secret military tribunal",
         "text": "Q sources confirm that Hillary Clinton was arrested by military police "
                 "and transported to Guantanamo Bay where she faces charges of treason. "
                 "The mainstream media is blacklisting this story. "
                 "Trump signed secret executive orders enabling military tribunals for deep state actors.",
         "label": 0},
        # REAL articles (label=1)
        {"title": "Federal Reserve raises interest rates by 25 basis points amid inflation concerns",
         "text": "The Federal Reserve raised its benchmark interest rate by a quarter percentage "
                 "point on Wednesday, the tenth increase in its current tightening cycle, "
                 "as it continues its fight against inflation while keeping a close eye on "
                 "stress in the banking sector. The move brings the federal funds rate to "
                 "a target range of 5 percent to 5.25 percent, the highest level in 16 years.",
         "label": 1},
        {"title": "Scientists discover new species of deep-sea fish near Mariana Trench",
         "text": "Marine biologists from the Scripps Institution of Oceanography have "
                 "discovered a previously unknown species of snailfish living at depths of "
                 "more than 8,000 meters in the Pacific Ocean. The translucent fish, which "
                 "measures about 30 centimeters, survives in near-freezing temperatures "
                 "and crushing pressures that would be lethal to most life forms.",
         "label": 1},
        {"title": "Congress passes bipartisan infrastructure bill after months of negotiations",
         "text": "The Senate passed a sweeping bipartisan infrastructure bill on Tuesday, "
                 "sending the $1.2 trillion measure to President Biden for his signature. "
                 "The legislation includes funding for roads, bridges, broadband internet, "
                 "water systems, and public transportation. The bill passed 69-30, "
                 "with 19 Republican senators joining all Democrats in support.",
         "label": 1},
        {"title": "European Central Bank announces new climate stress tests for major banks",
         "text": "The European Central Bank said on Thursday it would require the eurozone's "
                 "largest banks to assess the impact of climate change on their balance sheets "
                 "as part of a new supervisory stress test exercise. The tests, scheduled "
                 "for completion next year, will examine how banks would fare under various "
                 "climate scenarios over a 30-year time horizon.",
         "label": 1},
        {"title": "SpaceX successfully launches 60 Starlink satellites into orbit",
         "text": "SpaceX launched another batch of 60 Starlink broadband internet satellites "
                 "into orbit early Tuesday morning from Cape Canaveral Space Force Station. "
                 "The Falcon 9 rocket lifted off at 2:13 a.m. Eastern time, and the first "
                 "stage booster successfully landed on the drone ship in the Atlantic Ocean "
                 "approximately eight minutes after liftoff, marking its fourth mission.",
         "label": 1},
        {"title": "WHO recommends updated COVID-19 boosters for high-risk populations",
         "text": "The World Health Organization recommended on Friday that countries prioritize "
                 "updated COVID-19 booster shots for high-risk populations including elderly "
                 "people, immunocompromised individuals, and front-line health workers. "
                 "The guidance comes as several countries report upticks in infections "
                 "linked to new subvariants of the Omicron strain.",
         "label": 1},
        {"title": "Supreme Court rules on landmark environmental protection case",
         "text": "The Supreme Court ruled 5-4 on Monday to limit the Environmental Protection "
                 "Agency's authority to regulate carbon dioxide emissions from power plants, "
                 "dealing a significant blow to the Biden administration's climate agenda. "
                 "Writing for the majority, Chief Justice Roberts said Congress had not "
                 "clearly authorized the EPA to make choices of such vast economic significance.",
         "label": 1},
        {"title": "Apple reports record quarterly revenue driven by iPhone and services",
         "text": "Apple Inc reported record quarterly revenue of $123.9 billion on Thursday, "
                 "beating analyst expectations despite supply chain disruptions and a strong "
                 "dollar that weighed on international sales. iPhone revenue grew 9 percent "
                 "year over year to $71.6 billion, while the company's services segment "
                 "generated $20.8 billion, also a quarterly record.",
         "label": 1},
        {"title": "NASA's James Webb telescope reveals earliest known galaxies",
         "text": "The James Webb Space Telescope has captured images of galaxies that formed "
                 "just a few hundred million years after the Big Bang, providing astronomers "
                 "with their clearest view yet of the early universe. The findings, published "
                 "in Nature, show structures that challenge current models of how quickly "
                 "galaxies could form after the universe came into existence 13.8 billion years ago.",
         "label": 1},
    ]
    return pd.DataFrame(samples)


def preprocess_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Clean and standardize the raw DataFrame.
    """
    logger.info("Preprocessing dataset ...")

    # Standardise column names
    if "title" in df.columns:
        df = df.rename(columns={"title": "headline"})

    # Fill missing values
    df["headline"] = df["headline"].fillna("").astype(str)
    df["text"]     = df["text"].fillna("").astype(str) if "text" in df.columns else ""

    # Combine headline + content
    df["combined_text"] = df.apply(
        lambda row: combine_headline_content(row["headline"], row.get("text", "")),
        axis=1,
    )

    # Clean text
    logger.info("Cleaning text (this may take a few minutes on large datasets) ...")
    df["clean_text"] = df["combined_text"].apply(clean_text)

    # Drop rows where cleaning produced empty text
    df = df[df["clean_text"].str.strip().ne("")]
    df = df.dropna(subset=["clean_text", "label"])
    df["label"] = df["label"].astype(int)

    logger.info("Preprocessed %d rows", len(df))
    return df[["headline", "clean_text", "label"]]


def main():
    df_raw = load_datasets()
    df_clean = preprocess_dataframe(df_raw)
    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    df_clean.to_csv(OUTPUT_CSV, index=False)
    logger.info("Saved preprocessed dataset → %s", OUTPUT_CSV)
    return df_clean


if __name__ == "__main__":
    main()
