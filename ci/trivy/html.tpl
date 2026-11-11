{{- /*
  Trivy HTML report for Jenkins publishHTML.

  Jenkins serves published reports with a Content Security Policy that blocks inline <style> and
  <script>, which is why Trivy's contrib/html.tpl renders unstyled. This template has no inline CSS
  or JS: it loads report.css from the same directory, which the CSP allows ('self'). The Jenkinsfile
  copies ci/trivy/report.css next to the generated index.html.
*/ -}}
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="report.css">
  <title>Trivy Report</title>
</head>
<body>
{{- $critical := 0 }}{{ $high := 0 }}{{ $medium := 0 }}{{ $low := 0 }}{{ $unknown := 0 }}{{ $misconf := 0 }}
{{- range . }}
  {{- range .Vulnerabilities }}
    {{- if eq .Severity "CRITICAL" }}{{ $critical = add $critical 1 }}
    {{- else if eq .Severity "HIGH" }}{{ $high = add $high 1 }}
    {{- else if eq .Severity "MEDIUM" }}{{ $medium = add $medium 1 }}
    {{- else if eq .Severity "LOW" }}{{ $low = add $low 1 }}
    {{- else }}{{ $unknown = add $unknown 1 }}{{ end }}
  {{- end }}
  {{- $misconf = add $misconf (len .Misconfigurations) }}
{{- end }}
<header class="page-header">
  <p class="eyebrow">Trivy image scan</p>
  <h1>{{ if . }}{{ escapeXML (index . 0).Target }}{{ else }}No results{{ end }}</h1>
  <p class="meta">Generated {{ now | date "2006-01-02 15:04 MST" }}</p>
  <ul class="summary">
    <li class="tile sev-CRITICAL"><span class="count">{{ $critical }}</span><span class="label">Critical</span></li>
    <li class="tile sev-HIGH"><span class="count">{{ $high }}</span><span class="label">High</span></li>
    <li class="tile sev-MEDIUM"><span class="count">{{ $medium }}</span><span class="label">Medium</span></li>
    <li class="tile sev-LOW"><span class="count">{{ $low }}</span><span class="label">Low</span></li>
    <li class="tile"><span class="count">{{ $misconf }}</span><span class="label">Misconfigurations</span></li>
  </ul>
</header>
<main>
{{- range . }}
<section class="target">
  <h2>{{ escapeXML .Target }} <span class="badge">{{ escapeXML (toString .Type) }}</span></h2>
  {{- if .Vulnerabilities }}
  <div class="table-wrap">
  <table>
    <thead>
      <tr>
        <th>Package</th>
        <th>Vulnerability</th>
        <th>Severity</th>
        <th>Installed</th>
        <th>Fixed in</th>
        <th>Title</th>
      </tr>
    </thead>
    <tbody>
    {{- range .Vulnerabilities }}
      <tr>
        <td class="pkg">
          <strong>{{ escapeXML .PkgName }}</strong>
          {{- if .PkgPath }}<span class="path">{{ escapeXML .PkgPath }}</span>{{ end }}
        </td>
        <td class="id">
          {{- if .PrimaryURL }}<a href="{{ escapeXML .PrimaryURL }}">{{ escapeXML .VulnerabilityID }}</a>{{ else }}{{ escapeXML .VulnerabilityID }}{{ end }}
        </td>
        <td><span class="pill sev-{{ escapeXML .Severity }}">{{ escapeXML .Severity }}</span></td>
        <td class="mono">{{ escapeXML .InstalledVersion }}</td>
        <td class="mono fixed">{{ if .FixedVersion }}{{ escapeXML .FixedVersion }}{{ else }}<span class="muted">no fix</span>{{ end }}</td>
        <td class="title">
          {{ escapeXML .Title }}
          {{- if .References }}
          <details>
            <summary>{{ len .References }} references</summary>
            <ul class="refs">
            {{- range .References }}
              <li><a href="{{ escapeXML . }}">{{ escapeXML . }}</a></li>
            {{- end }}
            </ul>
          </details>
          {{- end }}
        </td>
      </tr>
    {{- end }}
    </tbody>
  </table>
  </div>
  {{- else }}
  <p class="empty">No vulnerabilities found</p>
  {{- end }}

  {{- if .Misconfigurations }}
  <h3>Misconfigurations</h3>
  <div class="table-wrap">
  <table>
    <thead>
      <tr>
        <th>Type</th>
        <th>ID</th>
        <th>Severity</th>
        <th>Title</th>
        <th>Message</th>
      </tr>
    </thead>
    <tbody>
    {{- range .Misconfigurations }}
      <tr>
        <td>{{ escapeXML .Type }}</td>
        <td class="id">{{ if .PrimaryURL }}<a href="{{ escapeXML .PrimaryURL }}">{{ escapeXML .ID }}</a>{{ else }}{{ escapeXML .ID }}{{ end }}</td>
        <td><span class="pill sev-{{ escapeXML .Severity }}">{{ escapeXML .Severity }}</span></td>
        <td>{{ escapeXML .Title }}</td>
        <td>{{ escapeXML .Message }}</td>
      </tr>
    {{- end }}
    </tbody>
  </table>
  </div>
  {{- end }}
</section>
{{- end }}
</main>
</body>
</html>
