import Link from "next/link";

import { Container } from "@/components/layout/container";
import { DemoDisclosure } from "@/components/layout/demo-disclosure";
import { buttonStyles } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { StatusPill } from "@/components/ui/status-pill";

const steps = [
  {
    number: "01",
    title: "Scan it",
    detail: "Create a private, living Passport for something you own.",
  },
  {
    number: "02",
    title: "Understand it",
    detail:
      "Gather the evidence that changes what your best options really are.",
  },
  {
    number: "03",
    title: "Circulate it",
    detail: "Follow a practical next move, then verify what happened.",
  },
];

export function LandingHome() {
  return (
    <>
      <header className="landing-header">
        <Container className="flex items-center justify-between">
          <Link aria-label="Circloora home" className="wordmark" href="/">
            <span aria-hidden="true" className="wordmark-mark">
              C
            </span>
            Circloora
          </Link>
          <Link className="header-link" href="/install">
            Install
          </Link>
        </Container>
      </header>

      <Container className="landing-hero">
        <div className="hero-copy">
          <p className="eyebrow">Your circular agent</p>
          <h1>Give everything another life.</h1>
          <p className="hero-subhead">
            Scan what you own. Circloora catalogs it, helps you care for it,
            finds what should happen next, and rewards verified circular action.
          </p>
          <p className="hero-thesis">
            A memory and action layer for physical things—not another recycling
            scanner.
          </p>
          <div className="hero-actions">
            <Link
              className={buttonStyles({ className: "hero-primary" })}
              href="/start?mode=room"
            >
              Scan a room
              <Icon name="arrow" size={18} />
            </Link>
            <Link
              className={buttonStyles({
                className: "hero-secondary",
                variant: "secondary",
              })}
              href="/start?mode=single"
            >
              Scan one thing
            </Link>
          </div>
          <p className="trust-line">
            <span aria-hidden="true" className="trust-dot" />
            Images are analyzed privately and are not stored by default.
          </p>
          <DemoDisclosure compact />
        </div>

        <div
          aria-label="Example Circloora Passport"
          className="passport-stage"
          role="img"
        >
          <div aria-hidden="true" className="orbit orbit-one" />
          <div aria-hidden="true" className="orbit orbit-two" />
          <article className="passport-card">
            <div className="passport-card-top">
              <div>
                <p className="passport-label">Circloora Passport</p>
                <h2>Walnut side chair</h2>
              </div>
              <span aria-hidden="true" className="passport-id">
                01
              </span>
            </div>
            <div className="object-portrait">
              <div aria-hidden="true" className="chair-shape">
                <span className="chair-back" />
                <span className="chair-seat" />
                <span className="chair-leg chair-leg-left" />
                <span className="chair-leg chair-leg-right" />
              </div>
              <span className="portrait-caption">
                Owned · remembered · in motion
              </span>
            </div>
            <div className="passport-decision">
              <div>
                <p>Best next move</p>
                <strong>Repair the loose joint</strong>
              </div>
              <StatusPill tone="positive">High confidence</StatusPill>
            </div>
            <div className="passport-metrics">
              <div>
                <span>Remaining value</span>
                <strong>$90–$140</strong>
              </div>
              <div>
                <span>Effort</span>
                <strong>Low</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>In use</strong>
              </div>
            </div>
          </article>
          <div className="agent-note">
            <Icon name="spark" size={17} />
            <span>
              <strong>Evidence changed the answer</strong>
              Solid wood makes repair the stronger next move.
            </span>
          </div>
        </div>
      </Container>

      <section aria-labelledby="how-it-works" className="landing-steps">
        <Container>
          <div className="section-intro">
            <p className="eyebrow">From ownership to outcome</p>
            <h2 id="how-it-works">One scan becomes a living record.</h2>
            <p>
              Circloora remembers what an object is, what it needs, and the
              decisions already made about it.
            </p>
          </div>
          <ol className="step-grid">
            {steps.map((step) => (
              <li key={step.number}>
                <span>{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.detail}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>
    </>
  );
}
