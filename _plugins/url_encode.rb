# _plugins/url_encode.rb
require 'liquid'
require 'uri'

# Percent encoding for URI conforming to RFC 3986.
# Ref: http://tools.ietf.org/html/rfc3986#page-12
module URLEncoding
  def url_encode(url)
    p = URI::Parser.new
    return p.escape(url, Regexp.new("[^#{URI::PATTERN::UNRESERVED}]"))
  end
end

Liquid::Template.register_filter(URLEncoding)
