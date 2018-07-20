import React, { Component, PureComponent } from 'react';
import Button from '@material-ui/core/Button';
import axios from 'axios';
import { BrowserRouter, Route, Link } from 'react-router-dom';
import SyntaxHighlighter, {
  registerLanguage,
} from 'react-syntax-highlighter/light';
import js from 'react-syntax-highlighter/languages/hljs/javascript';
import github from 'react-syntax-highlighter/styles/hljs/github';

registerLanguage('javascript', js);

const RecordingPage = ({ recording }) => (
  <SyntaxHighlighter language="javascript" style={github}>
    {recording}
  </SyntaxHighlighter>
);

class RecordingContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      recording: '',
    };
  }

  componentDidMount() {
    axios
      .get(`/__api/recordings/${this.props.match.params[0]}`)
      .then(response =>
        this.setState({
          recording: JSON.stringify(response.data, null, 2),
          loaded: true,
        })
      );
  }

  render() {
    return this.state.loaded ? (
      <RecordingPage recording={this.state.recording} />
    ) : null;
  }
}

const RecordingsPathPage = ({ recordings }) => (
  <ul>
    {recordings.map(r => (
      <li key={r}>
        <Link to={`/recordings/${r}`}>{r}</Link>
      </li>
    ))}
  </ul>
);

class RecordingsPathContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      recordings: [],
    };
  }

  componentDidMount() {
    axios
      .get(`/__api/recordings_path${this.props.match.params[0]}`)
      .then(response =>
        this.setState({
          recordings: response.data.recordings.sort().reverse(),
          loaded: true,
        })
      );
  }

  render() {
    return this.state.loaded ? (
      <RecordingsPathPage recordings={this.state.recordings} />
    ) : null;
  }
}

const RecordinsPage = ({ paths }) => (
  <ul>
    {paths.map(path => (
      <li key={path}>
        <Link to={`/recordings_path${path}`}>{path}</Link>
      </li>
    ))}
  </ul>
);

class RecordingsContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      recordingPaths: [],
    };
  }

  componentDidMount() {
    axios.get('/__api/recordings_all').then(response =>
      this.setState({
        recordingPaths: response.data.paths,
        loaded: true,
      })
    );
  }

  render() {
    return this.state.loaded ? (
      <RecordinsPage paths={this.state.recordingPaths} />
    ) : null;
  }
}

export const App = () => (
  <BrowserRouter>
    <div>
      <Route exact path="/" component={RecordingsContainer} />
      <Route path="/recordings_path*" component={RecordingsPathContainer} />
      <Route path="/recordings/*" component={RecordingContainer} />
    </div>
  </BrowserRouter>
);
