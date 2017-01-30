(function() {
  var events = ko.observableArray()

  axios.get('https://api.github.com/users/nathanboktae/events').then(function(resp) {
    events((resp.data || []).map(function(event) {
      var when = moment(event['created_at']), summary,
      issueLink = function() {
        return '<a href="' + event.payload.issue.url + '">#' + event.payload.issue.number + '</a>'
      },
      repoLink = function() {
        if (!event.repo) return ''
        return '<a class="repo" href="' + event.repo.url + '">' + event.repo.name + '</a>'
      },
      pullRequestLink = function() {
        return '<a href="' + event.payload['pull_request'].url + '">' + event.payload['pull_request'].title + '</a>'
      },
      commentLink = function() {
        return '<a href="' + event.payload.comment['html_url'] + '">Commented</a> on '
      }

      if (event.type === 'IssueCommentEvent') {
        summary = commentLink() + ' issue ' + issueLink() + ' in ' + repoLink()
      } else if (event.type === 'PushEvent') {
        summary = 'Pushed ' + event.payload.commits.length + ' commit(s) to ' + repoLink()
      } else if (event.type === 'PullRequestEvent') {
        summary = event.payload.action + ' pull request "' + pullRequestLink() + '" in ' + repoLink()
      } else if (event.type === 'PullRequestReviewCommentEvent') {
        summary = commentLink() + ' pull request "' + pullRequestLink() + '" in ' + repoLink()
      } else if (event.type === 'IssuesEvent') {
        summary = event.payload.action + ' issue #' + event.payload.issue.number + ' in ' + repoLink()
      } else if (event.type === 'CommitCommentEvent') {
        summary = commentLink() + ' a commit in ' + repoLink()
      } else if (event.type === 'CreateEvent' && event.payload['ref_type'] === 'branch') {
        summary = 'Created branch ' + event.payload.ref + ' in ' + repoLink()
      } else {
        summary = event.type + ' occured in repo ' + repoLink()
      }

      return {
        type: event.type,
        when: when.calendar(),
        summary: summary
      }
    }))
  })

  ko.applyBindings({
    events: events
  })
})()